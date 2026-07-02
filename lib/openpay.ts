// Cliente Openpay México fetch-only (Workers no corre el SDK oficial: usa node:http).
// Auth: HTTP Basic con la private key (sk_...) como usuario y password vacío.
// Hosts: prod https://api.openpay.mx, sandbox https://sandbox-api.openpay.mx. Base /v1/{merchantId}.

const PROD_BASE = 'https://api.openpay.mx';
const SANDBOX_BASE = 'https://sandbox-api.openpay.mx';

interface OpenpayConfig {
  merchantId: string;
  privateKey: string;
  base: string;
}

function readConfig(): OpenpayConfig {
  const merchantId = process.env.OPENPAY_MERCHANT_ID;
  const privateKey = process.env.OPENPAY_PRIVATE_KEY;
  if (!merchantId) throw new Error('OPENPAY_MERCHANT_ID missing');
  if (!privateKey) throw new Error('OPENPAY_PRIVATE_KEY missing');
  const base = process.env.OPENPAY_PRODUCTION === 'true' ? PROD_BASE : SANDBOX_BASE;
  return { merchantId, privateKey, base };
}

// El colon final manda password vacío (sin él, algunos stacks piden contraseña).
function basicAuth(privateKey: string): string {
  return `Basic ${btoa(`${privateKey}:`)}`;
}

export interface OpenpayErrorBody {
  category?: string;
  error_code?: number;
  description?: string;
  http_code?: number;
  request_id?: string;
}

export class OpenpayError extends Error {
  httpStatus: number;
  category?: string;
  errorCode?: number;
  requestId?: string;
  constructor(httpStatus: number, body: OpenpayErrorBody | null) {
    super(body?.description ?? `Openpay HTTP ${httpStatus}`);
    this.name = 'OpenpayError';
    this.httpStatus = httpStatus;
    this.category = body?.category;
    this.errorCode = body?.error_code;
    this.requestId = body?.request_id;
  }
}

// Declines reintentar-able: solo fondos insuficientes (3003). El resto es terminal/contactar banco.
export function isRetriableDecline(err: unknown): boolean {
  return err instanceof OpenpayError && err.errorCode === 3003;
}

async function openpayFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { merchantId, privateKey, base } = readConfig();
  const res = await fetch(`${base}/v1/${merchantId}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: basicAuth(privateKey),
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new OpenpayError(res.status, data as OpenpayErrorBody | null);
  }
  return data as T;
}

// --- Tipos de respuesta (solo los campos que usamos) ----------------------

export interface OpenpayCustomer {
  id: string;
  name: string;
  email: string;
}

export interface OpenpayCard {
  id: string;
  card_number: string; // enmascarado
  brand?: string;
  type?: string;
  holder_name?: string;
}

export type OpenpayChargeStatus = 'completed' | 'in_progress' | 'failed' | string;

export interface OpenpayCharge {
  id: string;
  status: OpenpayChargeStatus;
  amount: number;
  currency?: string;
  order_id?: string;
  error_message?: string | null;
}

// --- Operaciones -----------------------------------------------------------

export async function createCustomer(input: {
  name: string;
  email: string;
}): Promise<OpenpayCustomer> {
  return openpayFetch<OpenpayCustomer>('/customers', {
    method: 'POST',
    // requires_account:false = cliente solo-cobro (no abre cuenta/saldo en Openpay).
    body: { name: input.name, email: input.email, requires_account: false },
  });
}

// Archiva la tarjeta tokenizada en el cliente. token_id + device_session_id vienen de Openpay.js.
// El id devuelto es el source_id de todo cargo futuro.
export async function createCardFromToken(
  customerId: string,
  input: { tokenId: string; deviceSessionId: string },
): Promise<OpenpayCard> {
  return openpayFetch<OpenpayCard>(`/customers/${encodeURIComponent(customerId)}/cards`, {
    method: 'POST',
    body: { token_id: input.tokenId, device_session_id: input.deviceSessionId },
  });
}

// Cobro sobre tarjeta archivada (merchant-initiated). amount = decimal MXN con 2 decimales.
// order_id es nuestra clave idempotente (`${schoolId}:${YYYY-MM}`).
export async function chargeSavedCard(
  customerId: string,
  input: {
    sourceId: string;
    amount: number;
    description: string;
    orderId: string;
    deviceSessionId?: string;
    currency?: string;
  },
): Promise<OpenpayCharge> {
  return openpayFetch<OpenpayCharge>(`/customers/${encodeURIComponent(customerId)}/charges`, {
    method: 'POST',
    body: {
      method: 'card',
      source_id: input.sourceId,
      amount: Math.round(input.amount * 100) / 100,
      currency: input.currency ?? 'MXN',
      description: input.description,
      order_id: input.orderId,
      ...(input.deviceSessionId ? { device_session_id: input.deviceSessionId } : {}),
    },
  });
}

export async function getCharge(customerId: string, chargeId: string): Promise<OpenpayCharge> {
  return openpayFetch<OpenpayCharge>(
    `/customers/${encodeURIComponent(customerId)}/charges/${encodeURIComponent(chargeId)}`,
  );
}

export interface OpenpayWebhook {
  id: string;
  url: string;
  status?: string;
  event_types?: string[];
}

// Registro del webhook (one-time, super_admin). Tras esto Openpay manda un POST con
// { type:"verification", verification_code } que se activa MANUALMENTE en el dashboard
// (no hay endpoint /verify programático confirmado).
export async function createWebhook(input: {
  url: string;
  user: string;
  password: string;
  eventTypes: string[];
}): Promise<OpenpayWebhook> {
  return openpayFetch<OpenpayWebhook>('/webhooks', {
    method: 'POST',
    body: {
      url: input.url,
      user: input.user,
      password: input.password,
      event_types: input.eventTypes,
    },
  });
}

export async function listWebhooks(): Promise<OpenpayWebhook[]> {
  return openpayFetch<OpenpayWebhook[]>('/webhooks');
}
