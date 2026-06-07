import { z } from 'zod';

import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

const schema = z.object({
  code: z.string().trim().min(3).max(64),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await requireSession(req);
    if (session.user.role !== 'parent') {
      return Response.json({ error: 'ONLY_PARENTS' }, { status: 403 });
    }
    if (session.user.schoolId) {
      return Response.json({ error: 'ALREADY_IN_SCHOOL' }, { status: 400 });
    }
    const body = schema.parse(await req.json());
    const school = await prisma.school.findUnique({
      where: { internalCode: body.code },
      select: { id: true, name: true, active: true },
    });
    if (!school || !school.active) {
      return Response.json({ error: 'SCHOOL_NOT_FOUND' }, { status: 404 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { schoolId: school.id },
    });
    return Response.json({ ok: true, school: { id: school.id, name: school.name } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
