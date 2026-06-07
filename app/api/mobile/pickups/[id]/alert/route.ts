import { z } from 'zod';

import { prisma } from '@/lib/db';
import { sendPushToSchoolRoles } from '@/lib/push';
import { jsonError, requireRole } from '@/lib/session';

const schema = z.object({
  type: z.enum(['MEDICAL', 'ACCIDENT', 'VEHICLE', 'OTHER']),
  message: z.string().trim().max(500).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['parent']);
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip || trip.parentId !== session.user.id) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const severity = body.type === 'MEDICAL' || body.type === 'ACCIDENT' ? 'critical' : 'warning';
    const alert = await prisma.alert.create({
      data: {
        schoolId: trip.schoolId,
        type: 'TRIP_OVERDUE',
        targetRole: 'director',
        severity,
        payload: {
          tripId: id,
          alertType: body.type,
          message: body.message ?? null,
          reportedBy: session.user.id,
        },
      },
    });
    try {
      await sendPushToSchoolRoles(trip.schoolId, ['director', 'support_staff', 'super_admin'], {
        title: `Alerta ${body.type}`,
        body: body.message ?? 'Padre reportó alerta durante viaje',
        data: { type: 'trip-alert', tripId: id, alertId: alert.id, kind: body.type },
      });
    } catch {}
    return Response.json({ alertId: alert.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
