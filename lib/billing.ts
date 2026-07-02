import { prisma } from './db';
import { chargeSavedCard, OpenpayError } from './openpay';

export type BillingProvider = 'stripe' | 'openpay';

const MX_TOKENS = new Set(['MX', 'MEX', 'MEXICO', 'MÉXICO']);

// El ruteo de cobro lo decide la escuela: México (MXN) cobra por Openpay, el resto por Stripe.
export function resolveProvider(school: {
  country?: string | null;
  currency?: string | null;
}): BillingProvider {
  if ((school.currency ?? '').toUpperCase() === 'MXN') return 'openpay';
  if (MX_TOKENS.has((school.country ?? '').trim().toUpperCase())) return 'openpay';
  return 'stripe';
}

// Precio por alumno/mes en MXN (configurable; Stripe usa su propio price USD).
export function openpayPricePerStudentMXN(): number {
  const v = Number(process.env.OPENPAY_MXN_PRICE_PER_STUDENT);
  return Number.isFinite(v) && v > 0 ? v : 99;
}

// Precio por alumno/mes en USD (escuelas fuera de México).
export function usdPricePerStudent(): number {
  const v = Number(process.env.USD_PRICE_PER_STUDENT);
  return Number.isFinite(v) && v > 0 ? v : 6.99;
}

// Precio por alumno/mes según la moneda de cobro de la escuela (modelo del dueño:
// 99 MXN o 6.99 USD). Monedas no mapeadas caen al precio USD.
export function pricePerStudentFor(currency?: string | null): number {
  return (currency ?? '').toUpperCase() === 'MXN'
    ? openpayPricePerStudentMXN()
    : usdPricePerStudent();
}

// Corte duro por mora. Apagado por defecto: la decisión de producto (solo avisar vs.
// bloquear el panel) sigue abierta — hoy el vencimiento solo avisa (banner + PAST_DUE).
export function billingBlockEnabled(): boolean {
  return process.env.BILLING_BLOCK_ON_PAST_DUE === 'true';
}

// Barrido de trials vencidos: TRIALING sin tarjeta con trialEndsAt pasado → PAST_DUE.
// Lo dispara el cron diario junto al cobro. El aviso lo rinde el panel (banner del layout
// + badge en /admin/billing y en la lista de escuelas del owner).
export async function enforceTrialExpirations(now: Date): Promise<number> {
  const expired = await prisma.subscription.findMany({
    where: {
      status: 'TRIALING',
      trialEndsAt: { not: null, lte: now },
      openpayCardId: null,
      stripeSubscriptionId: null,
    },
    select: { schoolId: true, trialEndsAt: true },
  });
  for (const sub of expired) {
    await prisma.subscription.update({
      where: { schoolId: sub.schoolId },
      data: { status: 'PAST_DUE' },
    });
    await prisma.auditLog.create({
      data: {
        schoolId: sub.schoolId,
        action: 'TRIAL_EXPIRED',
        entity: 'Subscription',
        entityId: sub.schoolId,
        metadata: { trialEndsAt: sub.trialEndsAt?.toISOString() ?? null },
      },
    });
  }
  return expired.length;
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function addOneMonthUTC(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth() + 1,
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
    ),
  );
}

interface DueSubscription {
  schoolId: string;
  pricePerStudent: number;
  currency: string;
  nextChargeAt: Date | null;
  openpayCardId: string | null;
  openpayDeviceSessionId: string | null;
  school: { openpayCustomerId: string | null };
}

type ChargeOutcome = 'charged' | 'failed' | 'skipped';

async function chargeOneOpenpay(sub: DueSubscription, now: Date): Promise<ChargeOutcome> {
  const customerId = sub.school.openpayCustomerId;
  if (!customerId || !sub.openpayCardId || !sub.nextChargeAt) return 'skipped';

  const periodStart = sub.nextChargeAt;
  const periodEnd = addOneMonthUTC(periodStart);
  const key = `${sub.schoolId}:${monthKey(periodStart)}`;

  // El unique de idempotencyKey es el guard contra doble cobro del mismo periodo.
  // FAILED NO corta: el cron reintenta el periodo en mora todos los días (dunning) reusando
  // la misma factura — sin esto un decline congelaba el cobro para siempre (nextChargeAt no
  // avanza y la key del mes nunca cambia, ni con tarjeta nueva).
  const existing = await prisma.invoice.findUnique({
    where: { idempotencyKey: key },
    select: { id: true, status: true },
  });
  if (existing && existing.status !== 'FAILED') {
    if (existing.status === 'PAID') {
      await prisma.subscription.update({
        where: { schoolId: sub.schoolId },
        data: { nextChargeAt: periodEnd },
      });
    }
    // PENDING la concilia el webhook; VOID ya cerró el periodo.
    return 'skipped';
  }

  const count = await prisma.student.count({ where: { schoolId: sub.schoolId, active: true } });
  const amount = Math.round(count * sub.pricePerStudent * 100) / 100;

  // Sin alumnos activos no se cobra: factura $0 anulada y se avanza el periodo (congela cobro).
  if (count <= 0 || amount <= 0) {
    if (existing) {
      await prisma.invoice.update({
        where: { id: existing.id },
        data: { status: 'VOID', amount: 0 },
      });
    } else {
      await prisma.invoice.create({
        data: {
          schoolId: sub.schoolId,
          provider: 'openpay',
          idempotencyKey: key,
          amount: 0,
          status: 'VOID',
          periodStart,
          periodEnd,
        },
      });
    }
    await prisma.subscription.update({
      where: { schoolId: sub.schoolId },
      data: { nextChargeAt: periodEnd },
    });
    return 'skipped';
  }

  const invoice = existing
    ? await prisma.invoice.update({
        where: { id: existing.id },
        data: { status: 'PENDING', amount },
        select: { id: true },
      })
    : await prisma.invoice.create({
        data: {
          schoolId: sub.schoolId,
          provider: 'openpay',
          idempotencyKey: key,
          amount,
          status: 'PENDING',
          periodStart,
          periodEnd,
        },
        select: { id: true },
      });

  // Openpay no acepta order_id repetido: el primer intento usa la key limpia, los
  // reintentos de una factura FAILED llevan sufijo.
  const orderId = existing ? `${key}~${Date.now()}` : key;

  try {
    const charge = await chargeSavedCard(customerId, {
      sourceId: sub.openpayCardId,
      amount,
      currency: sub.currency,
      description: `Eez4us — ${monthKey(periodStart)} — ${count} alumnos`,
      orderId,
      deviceSessionId: sub.openpayDeviceSessionId ?? undefined,
    });

    const paid = charge.status === 'completed';
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        openpayChargeId: charge.id,
        ...(paid ? { status: 'PAID', paidAt: now } : {}),
      },
    });
    // 'in_progress' queda PENDING y lo concilia el webhook; avanzamos el reloj optimista igual.
    await prisma.subscription.update({
      where: { schoolId: sub.schoolId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        nextChargeAt: periodEnd,
      },
    });
    return 'charged';
  } catch (err) {
    const code = err instanceof OpenpayError ? err.errorCode : undefined;
    await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'FAILED' } });
    await prisma.subscription.update({
      where: { schoolId: sub.schoolId },
      data: { status: 'PAST_DUE' },
    });
    // No avanzamos nextChargeAt: el periodo queda en mora (dunning manual / nueva tarjeta).
    console.error('openpay charge failed', { schoolId: sub.schoolId, key, code });
    return 'failed';
  }
}

// Barrido mensual: cobra toda suscripción Openpay vencida. Lo dispara el cron (idempotente).
export async function runDueOpenpayCharges(
  now: Date,
): Promise<{ charged: number; failed: number; skipped: number }> {
  const due = (await prisma.subscription.findMany({
    where: {
      provider: 'openpay',
      status: { in: ['ACTIVE', 'PAST_DUE'] },
      nextChargeAt: { not: null, lte: now },
      openpayCardId: { not: null },
    },
    select: {
      schoolId: true,
      pricePerStudent: true,
      currency: true,
      nextChargeAt: true,
      openpayCardId: true,
      openpayDeviceSessionId: true,
      school: { select: { openpayCustomerId: true } },
    },
  })) as DueSubscription[];

  let charged = 0;
  let failed = 0;
  let skipped = 0;
  for (const sub of due) {
    // Un throw inesperado (ej. P2002 por corridas concurrentes del cron) no debe abortar
    // el barrido para las escuelas restantes.
    let outcome: ChargeOutcome;
    try {
      outcome = await chargeOneOpenpay(sub, now);
    } catch (err) {
      console.error('openpay charge crashed', { schoolId: sub.schoolId, err });
      outcome = 'failed';
    }
    if (outcome === 'charged') charged += 1;
    else if (outcome === 'failed') failed += 1;
    else skipped += 1;
  }
  return { charged, failed, skipped };
}
