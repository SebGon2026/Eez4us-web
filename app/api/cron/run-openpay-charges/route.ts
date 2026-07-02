import { enforceTrialExpirations, runDueOpenpayCharges } from '@/lib/billing';

function unauthorized(): Response {
  return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
}

async function handle(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: 'CRON_SECRET_MISSING' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) {
    return unauthorized();
  }

  try {
    const now = new Date();
    // Primero vence trials (todas las monedas/providers), después cobra los Openpay debidos.
    const trialsExpired = await enforceTrialExpirations(now);
    const result = await runDueOpenpayCharges(now);
    return Response.json({ ok: true, trialsExpired, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'INTERNAL';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<Response> {
  return handle(req);
}

export async function GET(req: Request): Promise<Response> {
  return handle(req);
}
