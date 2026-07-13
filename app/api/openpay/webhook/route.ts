import { prisma } from '@/lib/db';

interface OpenpayNotification {
  type: string;
  event_date?: string;
  verification_code?: string;
  transaction?: {
    id?: string;
    order_id?: string;
    status?: string;
    amount?: number;
    customer_id?: string;
  };
}

// Openpay nos llama con HTTP Basic usando el user/password que registramos en el webhook.
function checkInboundBasicAuth(req: Request): boolean {
  const user = process.env.OPENPAY_WEBHOOK_USER;
  const pass = process.env.OPENPAY_WEBHOOK_PASSWORD;
  if (!user || !pass) return false;
  const header = req.headers.get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return false;
  let decoded = '';
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  const idx = decoded.indexOf(':');
  if (idx < 0) return false;
  return decoded.slice(0, idx) === user && decoded.slice(idx + 1) === pass;
}

interface MatchedInvoice {
  id: string;
  schoolId: string;
  status: string;
  openpayChargeId: string | null;
}

async function findInvoice(
  orderId?: string,
  chargeId?: string,
): Promise<MatchedInvoice | null> {
  if (orderId) {
    const byKey = await prisma.invoice.findUnique({
      where: { idempotencyKey: orderId },
      select: { id: true, schoolId: true, status: true, openpayChargeId: true },
    });
    if (byKey) return byKey;
  }
  if (chargeId) {
    const byCharge = await prisma.invoice.findUnique({
      where: { openpayChargeId: chargeId },
      select: { id: true, schoolId: true, status: true, openpayChargeId: true },
    });
    if (byCharge) return byCharge;
  }
  return null;
}

async function setSubscriptionStatus(
  schoolId: string,
  status: 'ACTIVE' | 'PAST_DUE',
): Promise<void> {
  if (status === 'ACTIVE') {
    // Pago conciliado: sale de mora y limpia el reloj de gracia.
    await prisma.subscription.updateMany({
      where: { schoolId, provider: 'openpay' },
      data: { status, pastDueSince: null },
    });
    return;
  }
  // Mora: arranca el reloj de gracia solo si no venía ya en mora (no reiniciar cada evento).
  await prisma.subscription.updateMany({
    where: { schoolId, provider: 'openpay', pastDueSince: null },
    data: { pastDueSince: new Date() },
  });
  await prisma.subscription.updateMany({
    where: { schoolId, provider: 'openpay' },
    data: { status },
  });
}

async function handleEvent(evt: OpenpayNotification): Promise<void> {
  const tx = evt.transaction;
  if (!tx) return;
  const invoice = await findInvoice(tx.order_id, tx.id);
  if (!invoice) return;

  switch (evt.type) {
    case 'charge.succeeded':
      if (invoice.status !== 'PAID') {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            openpayChargeId: tx.id ?? invoice.openpayChargeId,
          },
        });
        await setSubscriptionStatus(invoice.schoolId, 'ACTIVE');
      }
      break;
    case 'charge.failed':
    case 'charge.cancelled':
      await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'FAILED' } });
      await setSubscriptionStatus(invoice.schoolId, 'PAST_DUE');
      break;
    case 'charge.refunded':
      await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'VOID' } });
      break;
    case 'chargeback.created':
    case 'chargeback.accepted':
      await setSubscriptionStatus(invoice.schoolId, 'PAST_DUE');
      break;
    default:
      break;
  }
}

export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  let evt: OpenpayNotification;
  try {
    evt = JSON.parse(raw) as OpenpayNotification;
  } catch {
    return new Response('bad json', { status: 400 });
  }

  // El handshake de verificación llega SIN credenciales: respondé 200 y logueá el código
  // para activarlo manualmente en el dashboard (no hay endpoint /verify programático).
  if (evt.type === 'verification') {
    console.log('openpay webhook verification', { code: evt.verification_code });
    return Response.json({ ok: true, verification_code: evt.verification_code ?? null });
  }

  if (!checkInboundBasicAuth(req)) {
    return new Response('unauthorized', { status: 401 });
  }

  try {
    await handleEvent(evt);
  } catch (err) {
    console.error('openpay webhook handler error', { type: evt.type, err });
    return new Response('handler error', { status: 500 });
  }
  return Response.json({ received: true });
}
