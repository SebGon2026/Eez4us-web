export interface InvitationEmailArgs {
  email: string;
  link: string;
  parentName: string;
  studentNames: string[];
}

// Resend self-hosted (fork de FreeResend, https://github.com/eibrahim/freeresend).
// Contrato verificado: POST {RESEND_BASE_URL}/api/emails
//   headers: Authorization: Bearer frs_...   Content-Type: application/json
//   body:    { from, to: string[], subject, html }   ->   { id, from, to, created_at }
// OJO: `to` es array (no string). Cliente fetch propio (Workers-native, sin SDK).
const DEFAULT_BASE_URL = 'https://mail.tequio.work';
const DEFAULT_FROM = 'tequio-mail@eez4us.com';
const MAX_RETRIES = 3;

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

function renderInvitationHtml({ link, parentName, studentNames }: InvitationEmailArgs): string {
  const safeLink = escapeHtml(link);
  const students =
    studentNames.length > 0
      ? `<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.5">Alumnos: <strong style="color:#0f172a">${studentNames
          .map(escapeHtml)
          .join(', ')}</strong></p>`
      : '';

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f1f5f9;font-family:'Nunito',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;padding:32px 20px">
      <div style="background:#ffffff;border-radius:24px;padding:32px;box-shadow:0 4px 16px rgba(15,23,42,0.08)">
        <h1 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800">Hola ${escapeHtml(parentName)}</h1>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.5">Tu escuela te invitó a coordinar la recogida con Eez4us. Activá tu cuenta para empezar.</p>
        ${students}
        <a href="${safeLink}" style="display:inline-block;background:#22c55e;color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;padding:14px 28px;border-radius:9999px">Activar mi cuenta</a>
        <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.5">Si el botón no abre, copiá este enlace:<br /><span style="color:#475569;word-break:break-all">${safeLink}</span></p>
      </div>
    </div>
  </body>
</html>`;
}

export async function sendInvitationEmail(args: InvitationEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const baseUrl = (process.env.RESEND_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      // Dev sin API key: dejamos el link en el log para poder testear el claim.
      // eslint-disable-next-line no-console
      console.warn(`[mailer] RESEND_API_KEY ausente — invite link para ${args.email}: ${args.link}`);
      return;
    }
    throw new Error('RESEND_API_KEY no configurado');
  }

  const payload = {
    from,
    to: [args.email],
    subject: 'Tu invitación a Eez4us',
    html: renderInvitationHtml(args),
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/api/emails`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Error de red: reintentar.
      lastError = err;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 250 * 2 ** attempt));
      }
      continue;
    }

    if (res.ok) return;

    const detail = await res.text().catch(() => '');
    // 4xx (salvo 408/429) = request inválido, no transitorio: cortar sin reintentar.
    if (res.status < 500 && res.status !== 408 && res.status !== 429) {
      throw new Error(`FreeResend ${res.status}: ${detail || 'envío rechazado'}`);
    }
    lastError = new Error(`FreeResend ${res.status}: ${detail || 'error transitorio'}`);
    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, 250 * 2 ** attempt));
    }
  }

  throw lastError ?? new Error('FreeResend: reintentos agotados');
}
