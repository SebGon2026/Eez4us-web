import { prisma } from './db';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_BATCH = 100;
const MAX_RETRIES = 3;

export interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoTicketSuccess {
  status: 'ok';
  id: string;
}

interface ExpoTicketError {
  status: 'error';
  message: string;
  details?: { error?: string };
}

type ExpoTicket = ExpoTicketSuccess | ExpoTicketError;

interface ExpoPushResponse {
  data?: ExpoTicket[];
  errors?: { code: string; message: string }[];
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function postBatch(messages: ExpoPushMessage[]): Promise<ExpoTicket[]> {
  const token = process.env.EXPO_ACCESS_TOKEN;
  let lastErr: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(messages),
      });

      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`Expo push HTTP ${res.status}`);
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Expo push HTTP ${res.status}: ${text}`);
      }

      const json = (await res.json()) as ExpoPushResponse;
      return json.data ?? [];
    } catch (err) {
      lastErr = err;
      await sleep(500 * Math.pow(2, attempt));
    }
  }
  throw lastErr ?? new Error('Expo push failed');
}

async function pruneToken(token: string): Promise<void> {
  try {
    await prisma.pushToken.delete({ where: { expoPushToken: token } });
  } catch {
    // already gone
  }
}

export interface SendExpoPushArgs {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SendExpoPushResult {
  sent: number;
  failed: number;
  pruned: number;
}

export async function sendExpoPush(args: SendExpoPushArgs): Promise<SendExpoPushResult> {
  const tokens = (Array.isArray(args.to) ? args.to : [args.to]).filter(
    (t) => typeof t === 'string' && t.length > 0,
  );
  if (tokens.length === 0) {
    return { sent: 0, failed: 0, pruned: 0 };
  }

  let sent = 0;
  let failed = 0;
  let pruned = 0;

  for (const batch of chunk(tokens, MAX_BATCH)) {
    const messages: ExpoPushMessage[] = batch.map((to) => ({
      to,
      title: args.title,
      body: args.body,
      data: args.data ?? {},
      sound: 'default',
      priority: 'high',
      channelId: 'default',
    }));

    let tickets: ExpoTicket[] = [];
    try {
      tickets = await postBatch(messages);
    } catch {
      failed += batch.length;
      continue;
    }

    for (let i = 0; i < batch.length; i++) {
      const ticket = tickets[i];
      const token = batch[i];
      if (!ticket) {
        failed += 1;
        continue;
      }
      if (ticket.status === 'ok') {
        sent += 1;
        continue;
      }
      failed += 1;
      const code = ticket.details?.error;
      if (code === 'DeviceNotRegistered' || code === 'InvalidCredentials') {
        await pruneToken(token);
        pruned += 1;
      }
    }
  }

  return { sent, failed, pruned };
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, unknown> },
): Promise<SendExpoPushResult> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId },
    select: { expoPushToken: true },
  });
  if (tokens.length === 0) return { sent: 0, failed: 0, pruned: 0 };
  return sendExpoPush({
    to: tokens.map((t) => t.expoPushToken),
    ...payload,
  });
}

export async function sendPushToSchoolRoles(
  schoolId: string,
  roles: string[],
  payload: { title: string; body: string; data?: Record<string, unknown> },
): Promise<SendExpoPushResult> {
  const tokens = await prisma.pushToken.findMany({
    where: { user: { schoolId, role: { in: roles } } },
    select: { expoPushToken: true },
  });
  if (tokens.length === 0) return { sent: 0, failed: 0, pruned: 0 };
  return sendExpoPush({
    to: tokens.map((t) => t.expoPushToken),
    ...payload,
  });
}
