// Wrapper around the OpenNext-generated worker that adds a `scheduled` handler
// so Cloudflare Cron Triggers can drive /api/cron/check-alerts.
//
// The fetch handler is delegated 1:1 to OpenNext; we only intercept `scheduled`.
import openNextDefault from './.open-next/worker.js';

export default {
  async fetch(request, env, ctx) {
    return openNextDefault.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    const baseUrl = (env.BETTER_AUTH_URL || 'https://eez4us.com').replace(/\/$/, '');
    const secret = env.CRON_SECRET ?? '';
    // El cron diario corre el cobro mensual de Openpay; el de cada minuto, las alertas.
    const path =
      event?.cron === '0 9 * * *'
        ? '/api/cron/run-openpay-charges'
        : '/api/cron/check-alerts';
    const req = new Request(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
    });
    ctx.waitUntil(
      openNextDefault.fetch(req, env, ctx).then(async (res) => {
        if (!res.ok) {
          // log to Workers tail
           
          console.error('cron failed', path, res.status, await res.text());
        }
      }),
    );
  },
};
