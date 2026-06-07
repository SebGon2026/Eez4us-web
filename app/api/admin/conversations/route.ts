import { z } from 'zod';

import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

const createSchema = z.object({
  parentId: z.string().cuid(),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(1).max(2000),
});

const broadcastSchema = z.object({
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(1).max(2000),
  scope: z.enum(['ALL', 'GRADE']).default('ALL'),
  gradeId: z.string().cuid().optional(),
});

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['director', 'support_staff', 'super_admin']);
    if (!session.user.schoolId) return Response.json({ conversations: [] });
    const items = await prisma.conversation.findMany({
      where: { schoolId: session.user.schoolId },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        parent: { select: { id: true, name: true, email: true, phoneE164: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return Response.json({
      conversations: items.map((c) => ({
        id: c.id,
        subject: c.subject,
        parent: c.parent,
        unread: c.unreadStaff,
        lastMessageAt: c.lastMessageAt.toISOString(),
        lastMessage: c.messages[0]
          ? {
              body: c.messages[0].body,
              senderType: c.messages[0].senderType,
              createdAt: c.messages[0].createdAt.toISOString(),
            }
          : null,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['director', 'support_staff', 'super_admin']);
    if (!session.user.schoolId) return Response.json({ error: 'NO_SCHOOL' }, { status: 400 });

    const url = new URL(req.url);
    const broadcast = url.searchParams.get('broadcast') === '1';

    if (broadcast) {
      const body = broadcastSchema.parse(await req.json());
      let parents: { id: string }[];
      if (body.scope === 'GRADE' && body.gradeId) {
        const links = await prisma.parentStudent.findMany({
          where: {
            student: { schoolId: session.user.schoolId, gradeId: body.gradeId },
          },
          select: { parentId: true },
          distinct: ['parentId'],
        });
        parents = links.map((l) => ({ id: l.parentId }));
      } else {
        parents = await prisma.user.findMany({
          where: { schoolId: session.user.schoolId, role: 'parent' },
          select: { id: true },
        });
      }
      // Cada par (conv upsert + message create) corre en transacción para evitar
      // dejar conversaciones sin mensaje si falla a mitad del loop.
      let created = 0;
      for (const p of parents) {
        await prisma.$transaction(async (tx) => {
          const conv = await tx.conversation.upsert({
            where: { schoolId_parentId: { schoolId: session.user.schoolId!, parentId: p.id } },
            update: {
              lastMessageAt: new Date(),
              unreadParent: { increment: 1 },
            },
            create: {
              schoolId: session.user.schoolId!,
              parentId: p.id,
              subject: body.subject,
              lastMessageAt: new Date(),
              unreadParent: 1,
            },
          });
          await tx.message.create({
            data: {
              conversationId: conv.id,
              senderId: session.user.id,
              senderType: 'STAFF',
              body: body.message,
            },
          });
        });
        created++;
      }
      return Response.json({ broadcasted: created }, { status: 201 });
    }

    const body = createSchema.parse(await req.json());
    const parent = await prisma.user.findUnique({ where: { id: body.parentId } });
    if (!parent || parent.schoolId !== session.user.schoolId || parent.role !== 'parent') {
      return Response.json({ error: 'INVALID_PARENT' }, { status: 400 });
    }
    const conv = await prisma.conversation.upsert({
      where: { schoolId_parentId: { schoolId: session.user.schoolId, parentId: parent.id } },
      update: {
        subject: body.subject ?? undefined,
        lastMessageAt: new Date(),
        unreadParent: { increment: 1 },
      },
      create: {
        schoolId: session.user.schoolId,
        parentId: parent.id,
        subject: body.subject,
        lastMessageAt: new Date(),
        unreadParent: 1,
      },
    });
    const message = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: session.user.id,
        senderType: 'STAFF',
        body: body.message,
      },
    });
    return Response.json({ conversation: conv, message }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
