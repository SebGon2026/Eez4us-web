import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireSession(req);
    if (session.user.role !== 'parent') {
      return Response.json({ error: 'ONLY_PARENTS' }, { status: 403 });
    }
    const conversations = await prisma.conversation.findMany({
      where: { parentId: session.user.id },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        school: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, body: true, senderType: true, createdAt: true },
        },
      },
    });
    return Response.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        subject: c.subject,
        school: c.school,
        unread: c.unreadParent,
        lastMessageAt: c.lastMessageAt.toISOString(),
        lastMessage: c.messages[0]
          ? {
              id: c.messages[0].id,
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
