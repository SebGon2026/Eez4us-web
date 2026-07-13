import { z } from 'zod';

import { prisma } from '@/lib/db';
import { HttpError, jsonError, requireRole } from '@/lib/session';

// Ajuste del trial y/o la gracia por impago de UNA escuela por el owner (super_admin):
// fecha absoluta o extensión en días desde el fin vigente (o desde hoy si ya venció), y/o
// los días de gracia tras impago. Con AuditLog siempre.
const bodySchema = z
  .object({
    trialEndsAt: z.string().datetime().optional(),
    extendDays: z.number().int().min(1).max(365).optional(),
    // Gracia por impago configurable por colegio (0 = corte inmediato, hasta 60 días).
    gracePeriodDays: z.number().int().min(0).max(60).optional(),
  })
  // trialEndsAt y extendDays son mutuamente excluyentes; gracePeriodDays es independiente.
  .refine((b) => !(b.trialEndsAt && b.extendDays), { message: 'trialEndsAt XOR extendDays' })
  .refine(
    (b) => b.trialEndsAt != null || b.extendDays != null || b.gracePeriodDays != null,
    { message: 'NOTHING_TO_UPDATE' },
  );

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
        gracePeriodDays: true,
      },
    });
    if (!sub) throw new HttpError(404, 'SUBSCRIPTION_NOT_FOUND');

    const wantsTrialChange = body.trialEndsAt != null || body.extendDays != null;

    // El trial de una suscripción Stripe vive en Stripe: extenderlo solo en nuestra DB
    // dejaría a Stripe cobrando igual durante el "trial extendido". Se maneja en su dashboard.
    // La gracia SÍ es nuestra (el corte del panel lo hacemos nosotros), así que un cambio de
    // solo-gracia se permite también para escuelas Stripe.
    if (wantsTrialChange && sub.stripeSubscriptionId) {
      return Response.json({ error: 'STRIPE_MANAGED' }, { status: 409 });
    }

    const now = new Date();
    const data: Record<string, unknown> = {};
    const auditMeta: Record<string, unknown> = {};

    if (body.gracePeriodDays != null) {
      data.gracePeriodDays = body.gracePeriodDays;
      auditMeta.gracePeriodDays = { from: sub.gracePeriodDays, to: body.gracePeriodDays };
    }

    let newEnd: Date | null = null;
    if (wantsTrialChange) {
      const currentEnd = sub.trialEndsAt ?? sub.currentPeriodEnd;
      const base = currentEnd && currentEnd > now ? currentEnd : now;
      newEnd = body.trialEndsAt
        ? new Date(body.trialEndsAt)
        : new Date(base.getTime() + (body.extendDays ?? 0) * 24 * 60 * 60 * 1000);

      const hasCard = !!sub.openpayCardId;
      const nextChargeAt =
        sub.nextChargeAt && sub.nextChargeAt > newEnd ? sub.nextChargeAt : newEnd;
      data.trialEndsAt = newEnd;
      // Sin tarjeta: extender a futuro revive el trial (y saca la mora si la había).
      if (!hasCard && newEnd > now) {
        data.status = 'TRIALING';
        data.currentPeriodEnd = newEnd;
        data.pastDueSince = null;
      }
      // Con tarjeta: la gracia limpia la mora (ACTIVE) y corre el próximo cobro al nuevo fin.
      if (hasCard && newEnd > now) {
        data.status = 'ACTIVE';
        data.nextChargeAt = nextChargeAt;
        data.pastDueSince = null;
      }
      auditMeta.trial = { from: currentEnd?.toISOString() ?? null, to: newEnd.toISOString() };
      if (body.extendDays) auditMeta.extendDays = body.extendDays;
    }

    const updated = await prisma.subscription.update({
      where: { schoolId },
      data,
      select: { status: true, trialEndsAt: true, nextChargeAt: true, gracePeriodDays: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        schoolId,
        action: wantsTrialChange ? 'UPDATE_TRIAL' : 'UPDATE_GRACE',
        entity: 'Subscription',
        entityId: schoolId,
        metadata: auditMeta,
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
