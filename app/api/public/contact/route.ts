import { z } from 'zod';

// Endpoint PÚBLICO (sin auth): recibe el formulario de contacto de la landing
// y lo reenvía por email vía Resend. Autocontenido a propósito — no reusa
// lib/mailer para no acoplar el flujo de invitaciones al de marketing.
const CONTACT_TO = 'cesar.vargas@eez4us.com';
const DEFAULT_BASE_URL = 'https://api.resend.com';
const DEFAULT_FROM = 'tequio-mail@eez4us.com';
const MAX_RETRIES = 3;

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  school: z.string().trim().min(2).max(160),
  email: z.string().trim().pipe(z.email().max(200)),
  phone: z.string().trim().max(40).optional().default(''),
  city: z.string().trim().max(120).optional().default(''),
  message: z.string().trim().min(10).max(2000),
  // Honeypot: los humanos no lo ven, los bots lo llenan.
  website: z.string().optional().default(''),
});

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

function renderContactHtml(data: z.infer<typeof contactSchema>): string {
  const row = (label: string, value: string) =>
    value
      ? `<tr>
          <td style="padding:6px 16px 6px 0;color:#94a3b8;font-size:13px;font-weight:700;vertical-align:top;white-space:nowrap">${label}</td>
          <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600">${escapeHtml(value)}</td>
        </tr>`
      : '';

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f1f5f9;font-family:'Nunito',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px">
      <div style="background:#ffffff;border-radius:24px;padding:32px;box-shadow:0 4px 16px rgba(15,23,42,0.08)">
        <h1 style="margin:0 0 4px;color:#0f172a;font-size:20px;font-weight:800">Nuevo contacto desde la landing</h1>
        <p style="margin:0 0 20px;color:#475569;font-size:14px">Enviado desde el formulario de eez4us.com</p>
        <table style="border-collapse:collapse;width:100%">
          ${row('Nombre', data.name)}
          ${row('Colegio', data.school)}
          ${row('Email', data.email)}
          ${row('Teléfono', data.phone)}
          ${row('Ciudad', data.city)}
        </table>
        <p style="margin:20px 0 0;padding:16px;background:#f8fafc;border-radius:16px;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(data.message)}</p>
        <p style="margin:20px 0 0;color:#94a3b8;font-size:12px">Puedes responder directo a este correo: llega a ${escapeHtml(data.email)}.</p>
      </div>
    </div>
  </body>
</html>`;
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'INVALID_FIELDS' }, { status: 400 });
  }

  // Honeypot lleno = bot. Respondemos ok sin enviar nada.
  if (parsed.data.website) {
    return Response.json({ ok: true });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const baseUrl = (process.env.RESEND_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[contact] RESEND_API_KEY ausente — contacto de ${parsed.data.email} no enviado`,
      );
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'SEND_FAILED' }, { status: 500 });
  }

  const basePayload = {
    to: [CONTACT_TO],
    reply_to: parsed.data.email,
    subject: `Contacto landing: ${parsed.data.school}`,
    html: renderContactHtml(parsed.data),
  };

  async function attemptSend(sender: string): Promise<{ ok: boolean; status: number; body: string }> {
    let lastStatus = 0;
    let lastBody = '';
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/emails`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ from: sender, ...basePayload }),
        });
      } catch {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 250 * 2 ** attempt));
        }
        continue;
      }

      if (res.ok) return { ok: true, status: res.status, body: '' };

      lastStatus = res.status;
      lastBody = await res.text().catch(() => '');
      // 4xx (salvo 408/429) = request inválido, no transitorio: cortar sin reintentar.
      if (res.status < 500 && res.status !== 408 && res.status !== 429) break;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 250 * 2 ** attempt));
      }
    }
    return { ok: false, status: lastStatus, body: lastBody };
  }

  let result = await attemptSend(from);
  // Dominio sin verificar en Resend: remitente de emergencia (entrega porque CONTACT_TO
  // es el dueño de la cuenta Resend). Se vuelve solo al dominio propio al verificarlo.
  if (!result.ok && /not verified/i.test(result.body)) {
    console.error(`[contact] dominio de ${from} sin verificar; reintento con onboarding@resend.dev`);
    result = await attemptSend('Eez4us <onboarding@resend.dev>');
  }
  if (result.ok) return Response.json({ ok: true });

  console.error(`[contact] Resend falló (status ${result.status || 'red'})`);
  return Response.json({ error: 'SEND_FAILED' }, { status: 502 });
}
