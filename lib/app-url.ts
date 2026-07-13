// Base URL del app para links generados server-side (emails de invitación, retorno del
// portal de Stripe, webhook de Openpay). BETTER_AUTH_URL va primero porque es var de
// RUNTIME del Worker (wrangler.toml [vars]) y trae el host del entorno real;
// NEXT_PUBLIC_APP_URL se congela en build-time (OpenNext hornea el .env de la máquina
// que buildea en next-env.mjs), así que un deploy manual la manda a prod valiendo
// http://localhost:3000 — nunca debe tener prioridad en server.
export function appBaseUrl(): string {
  const base = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
  return base.replace(/\/$/, '');
}
