import { z } from 'zod';

import { prisma } from '@/lib/db';
import { HttpError, jsonError, requireRole } from '@/lib/session';

// Ajuste del trial de UNA escuela por el owner (super_admin): fecha absoluta o extensión
// en días desde el fin vigente (o desde hoy si ya venció). Con AuditLog siempre.
const bodySchema = z
  .object({
    trialEndsAt: z.string().datetime().optional(),
    extendDays: z.number().int().min(1).max(365).optional(),
  })
  .refine((b) => (b.trialEndsAt ? !b.extendDays : !!b.extendDays), {
    message: 'trialEndsAt XOR extendDays',
  });

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(req, ['super_admin']);
    const { id: schoolId } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const sub = await prisma.subscription.findUnique({
      where: { schoolId },
      select: {
        status: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        nextChargeAt: true,
        openpayCardId: true,
        stripeSubscriptionId: true,
      },
    });
    if (!sub) throw new HttpError(404, 'SUBSCRIPTION_NOT_FOUND');

    // El trial de una suscripción Stripe vive en Stripe: extenderlo solo en nuestra DB
    // dejaría a Stripe cobrando igual durante el "trial extendido". Se maneja en su dashboard.
    if (sub.stripeSubscriptionId) {
      return Response.json({ error: 'STRIPE_MANAGED' }, { status: 409 });
    }

    const now = new Date();
    const currentEnd = sub.trialEndsAt ?? sub.currentPeriodEnd;
    const base = currentEnd && currentEnd > now ? currentEnd : now;
    const newEnd = body.trialEndsAt
      ? new Date(body.trialEndsAt)
      : new Date(base.getTime() + (body.extendDays ?? 0) * 24 * 60 * 60 * 1000);

    const hasCard = !!sub.openpayCardId;
    const nextChargeAt =
      sub.nextChargeAt && sub.nextChargeAt > newEnd ? sub.nextChargeAt : newEnd;
    const updated = await prisma.subscription.update({
      where: { schoolId },
      data: {
        trialEndsAt: newEnd,
        // Sin tarjeta: extender a futuro revive el trial (y saca la mora si la había).
        ...(!hasCard && newEnd > now ? { status: 'TRIALING', currentPeriodEnd: newEnd } : {}),
        // Con tarjeta: la gracia limpia la mora (ACTIVE) y corre el próximo cobro al nuevo
        // fin — el cron cobra ACTIVE/PAST_DUE cuando venza, no antes.
        ...(hasCard && newEnd > now ? { status: 'ACTIVE', nextChargeAt } : {}),
      },
      select: { status: true, trialEndsAt: true, nextChargeAt: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        schoolId,
        action: 'UPDATE_TRIAL',
        entity: 'Subscription',
        entityId: schoolId,
        metadata: {
          from: currentEnd?.toISOString() ?? null,
          to: newEnd.toISOString(),
          ...(body.extendDays ? { extendDays: body.extendDays } : {}),
        },
      },
    });

    return Response.json({ subscription: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY', issues: err.issues }, { status: 400 });
    }
    return jsonError(err);
  }
}
