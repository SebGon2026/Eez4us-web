import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

export async function DELETE(req: Request): Promise<Response> {
  try {
    const session = await requireSession(req);
    if (session.user.role !== 'parent') {
      return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    await prisma.user.delete({ where: { id: session.user.id } });
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
