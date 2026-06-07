import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireSession(req);
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30', 10) || 30, 100);
    const items = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    });
    return Response.json({ notifications: items, unreadCount });
  } catch (err) {
    return jsonError(err);
  }
}
