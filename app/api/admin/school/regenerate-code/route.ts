import { nanoid } from 'nanoid';

import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['director', 'super_admin']);
    if (!session.user.schoolId) return Response.json({ error: 'NO_SCHOOL' }, { status: 400 });
    let attempt = 0;
    while (attempt < 5) {
      const code = nanoid(8).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
      const exists = await prisma.school.findUnique({ where: { internalCode: code } });
      if (!exists) {
        const updated = await prisma.school.update({
          where: { id: session.user.schoolId },
          data: { internalCode: code },
          select: { internalCode: true },
        });
        return Response.json({ internalCode: updated.internalCode });
      }
      attempt++;
    }
    return Response.json({ error: 'COULD_NOT_GENERATE' }, { status: 500 });
  } catch (err) {
    return jsonError(err);
  }
}
