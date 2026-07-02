import { createWebhook } from '@/lib/openpay';
import { jsonError, requireRole } from '@/lib/session';

const ALLOWED_ROLES = ['super_admin'];

// Conveniencia para registrar el webhook una vez. Openpay responde con un POST de
// verificación; activalo ingresando el verification_code en el dashboard de Openpay.
export async function POST(req: Request): Promise<Response> {
  try {
    await requireRole(req, ALLOWED_ROLES);
    const user = process.env.OPENPAY_WEBHOOK_USER;
    const password = process.env.OPENPAY_WEBHOOK_PASSWORD;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL;
    if (!user || !password) {
      return Response.json({ error: 'WEBHOOK_CREDS_MISSING' }, { status: 500 });
    }
    if (!appUrl) {
      return Response.json({ error: 'APP_URL_MISSING' }, { status: 500 });
    }

    const webhook = await createWebhook({
      url: `${appUrl.replace(/\/$/, '')}/api/openpay/webhook`,
      user,
      password,
      eventTypes: [
        'charge.succeeded',
        'charge.failed',
        'charge.cancelled',
        'charge.refunded',
        'chargeback.created',
        'chargeback.accepted',
      ],
    });

    return Response.json({
      ok: true,
      webhook,
      note: 'Openpay enviará un POST de verificación a /api/openpay/webhook; activá el webhook ingresando el verification_code en el dashboard de Openpay.',
    });
  } catch (err) {
    return jsonError(err);
  }
}
