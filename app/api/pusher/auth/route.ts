import { encodeBase64 } from 'tweetnacl-util';

import { auth } from '@/lib/auth';
import { deriveChannelKey, readEncryptionMasterKey } from '@/lib/pusher-encrypt';

async function hmacSHA256Hex(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(req: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const form = await req.formData();
  const socketId = form.get('socket_id');
  const channelName = form.get('channel_name');

  if (typeof socketId !== 'string' || typeof channelName !== 'string') {
    return new Response('Bad Request', { status: 400 });
  }

  const authSig = await hmacSHA256Hex(process.env.PUSHER_SECRET!, `${socketId}:${channelName}`);
  const authPayload = `${process.env.PUSHER_KEY}:${authSig}`;

  const response: { auth: string; shared_secret?: string } = { auth: authPayload };

  if (channelName.startsWith('private-encrypted-')) {
    const channelKey = await deriveChannelKey(readEncryptionMasterKey(), channelName);
    response.shared_secret = encodeBase64(channelKey);
  }

  return Response.json(response);
}
