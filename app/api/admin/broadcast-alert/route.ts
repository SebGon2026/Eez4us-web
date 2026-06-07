import { z } from 'zod';

import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';

const schema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(500),
  severity: z.enum(['info', 'warning', 'critical']).default('info'),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ['director', 'super_admin']);
    if (!session.user.schoolId) return Response.json({ error: 'NO_SCHOOL' }, { status: 400 });
    const body = schema.parse(await req.json());

    const parents = await prisma.user.findMany({
      where: { schoolId: session.user.schoolId, role: 'parent' },
      select: { id: true },
    });

    let created = 0;
    for (const p of parents) {
      await prisma.notification.create({
        data: {
          userId: p.id,
          title: body.title,
          body: body.body,
          data: { severity: body.severity, source: 'broadcast' },
        },
      });
      created++;
    }
    await prisma.alert.create({
      data: {
        schoolId: session.user.schoolId,
        type: 'INVITATION_STALE',
        severity: body.severity,
        targetRole: 'parent',
        payload: {
          kind: 'broadcast',
          title: body.title,
          body: body.body,
          createdBy: session.user.id,
        },
      },
    });
    return Response.json({ ok: true, recipients: created }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
