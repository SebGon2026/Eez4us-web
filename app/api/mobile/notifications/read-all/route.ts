import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

// Bulk mark-all-read: evita que el mobile haga N PUTs por id al abrir la campana.
export async function PUT(req: Request): Promise<Response> {
  try {
    const session = await requireSession(req);
    const result = await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return Response.json({ ok: true, marked: result.count });
  } catch (err) {
    return jsonError(err);
  }
}
