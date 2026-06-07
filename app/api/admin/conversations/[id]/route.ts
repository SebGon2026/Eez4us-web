import { z } from 'zod';

import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

const postSchema = z.object({ message: z.string().trim().min(1).max(2000) });

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['director', 'support_staff', 'super_admin']);
    const { id } = await ctx.params;
    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, email: true, phoneE164: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, role: true } } },
        },
      },
    });
    if (!conv || conv.schoolId !== session.user.schoolId) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    await prisma.conversation.update({ where: { id }, data: { unreadStaff: 0 } });
    return Response.json({ conversation: conv });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['director', 'support_staff', 'super_admin']);
    const { id } = await ctx.params;
    const body = postSchema.parse(await req.json());
    const conv = await prisma.conversation.findUnique({ where: { id } });
    if (!conv || conv.schoolId !== session.user.schoolId) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: session.user.id,
        senderType: 'STAFF',
        body: body.message,
      },
    });
    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        unreadParent: { increment: 1 },
        unreadStaff: 0,
      },
    });
    return Response.json({ message }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
