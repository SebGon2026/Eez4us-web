import { z } from 'zod';

import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

const postSchema = z.object({ message: z.string().trim().min(1).max(2000) });

export async function GET(
  req: Request,
  ctx: { params: Promise<{ conversationId: string }> },
): Promise<Response> {
  try {
    const session = await requireSession(req);
    const { conversationId } = await ctx.params;
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    if (conv.parentId !== session.user.id && conv.schoolId !== session.user.schoolId) {
      return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        body: true,
        senderType: true,
        senderId: true,
        readAt: true,
        createdAt: true,
        sender: { select: { id: true, name: true, role: true } },
      },
    });
    // Mark read for current side
    if (session.user.id === conv.parentId) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { unreadParent: 0 },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { unreadStaff: 0 },
      });
    }
    return Response.json({ messages });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ conversationId: string }> },
): Promise<Response> {
  try {
    const session = await requireSession(req);
    const { conversationId } = await ctx.params;
    const body = postSchema.parse(await req.json());
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) return Response.json({ error: 'NOT_FOUND' }, { status: 404 });

    const isParent = conv.parentId === session.user.id;
    const isStaff =
      conv.schoolId === session.user.schoolId &&
      ['director', 'support_staff', 'super_admin'].includes(session.user.role);
    if (!isParent && !isStaff) {
      return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const senderType = isParent ? 'PARENT' : 'STAFF';
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        senderType,
        body: body.message,
      },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadStaff: isParent ? { increment: 1 } : 0,
        unreadParent: isStaff ? { increment: 1 } : 0,
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
