import { type AppLocale, DEFAULT_LOCALE } from './locale';

export interface InvitationEmailArgs {
  email: string;
  link: string;
  parentName: string;
  studentNames: string[];
  // Idioma del destinatario (país del colegio). Default 'es' para no romper callers viejos.
  locale?: AppLocale;
}

// Textos de los emails salientes por idioma. El locale llega explícito (país del
// colegio o cookie del panel) porque estos envíos corren también en crons/webhooks
// sin request. El ES mantiene el voseo original.
const MAIL_M: Record<
  AppLocale,
  {
    invitationSubject: string;
    invitationTitle: (name: string) => string;
    invitationIntro: string;
    invitationStudentsLabel: string;
    invitationCta: string;
    linkFallback: string;
    otpSubject: (otp: string) => string;
    otpTitle: string;
    otpIntro: string;
    otpFooter: string;
    resetSubject: string;
    resetTitle: string;
    resetIntro: string;
    resetCta: string;
  }
> = {
  es: {
    invitationSubject: 'Tu invitación a Eez4us',
    invitationTitle: (name) => `Hola ${name}`,
    invitationIntro: 'Tu escuela te invitó a coordinar la recogida con Eez4us. Activá tu cuenta para empezar.',
    invitationStudentsLabel: 'Alumnos:',
    invitationCta: 'Activar mi cuenta',
    linkFallback: 'Si el botón no abre, copiá este enlace:',
    otpSubject: (otp) => `${otp} es tu código de acceso a Eez4us`,
    otpTitle: 'Tu código de acceso',
    otpIntro: 'Usá este código para completar tu inicio de sesión en el panel de Eez4us:',
    otpFooter: 'El código vence en unos minutos. Si no intentaste iniciar sesión, cambiá tu contraseña.',
    resetSubject: 'Restablecé tu contraseña de Eez4us',
    resetTitle: 'Restablecer contraseña',
    resetIntro: 'Pediste restablecer tu contraseña de Eez4us. El enlace vence pronto; si no fuiste vos, ignorá este correo.',
    resetCta: 'Restablecer contraseña',
  },
  en: {
    invitationSubject: 'Your Eez4us invitation',
    invitationTitle: (name) => `Hi ${name}`,
    invitationIntro: 'Your school invited you to coordinate pickup with Eez4us. Activate your account to get started.',
    invitationStudentsLabel: 'Students:',
    invitationCta: 'Activate my account',
    linkFallback: 'If the button does not open, copy this link:',
    otpSubject: (otp) => `${otp} is your Eez4us access code`,
    otpTitle: 'Your access code',
    otpIntro: 'Use this code to finish signing in to the Eez4us panel:',
    otpFooter: 'The code expires in a few minutes. If you did not try to sign in, change your password.',
    resetSubject: 'Reset your Eez4us password',
    resetTitle: 'Reset password',
    resetIntro: 'You asked to reset your Eez4us password. The link expires soon; if this was not you, ignore this email.',
    resetCta: 'Reset password',
  },
};

// Resend oficial (api.resend.com). El fork self-hosted (mail.tequio.work) quedó fuera
// de servicio en 2026-07 y se migró a la API pública.
// Contrato: POST {RESEND_BASE_URL}/emails
//   headers: Authorization: Bearer re_...   Content-Type: application/json
//   body:    { from, to: string[], subject, html }   ->   { id }
// OJO: `to` es array (no string). Requiere eez4us.com verificado en resend.com/domains.
// Cliente fetch propio (Workers-native, sin SDK).
const DEFAULT_BASE_URL = 'https://api.resend.com';
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

function renderInvitationHtml({ link, parentName, studentNames, locale = DEFAULT_LOCALE }: InvitationEmailArgs): string {
  const m = MAIL_M[locale];
  const safeLink = escapeHtml(link);
  const students =
    studentNames.length > 0
      ? `<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.5">${m.invitationStudentsLabel} <strong style="color:#0f172a">${studentNames
          .map(escapeHtml)
          .join(', ')}</strong></p>`
      : '';

  return `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;background:#f1f5f9;font-family:'Nunito',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;padding:32px 20px">
      <div style="background:#ffffff;border-radius:24px;padding:32px;box-shadow:0 4px 16px rgba(15,23,42,0.08)">
        <h1 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800">${m.invitationTitle(escapeHtml(parentName))}</h1>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.5">${m.invitationIntro}</p>
        ${students}
        <a href="${safeLink}" style="display:inline-block;background:#22c55e;color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;padding:14px 28px;border-radius:9999px">${m.invitationCta}</a>
        <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.5">${m.linkFallback}<br /><span style="color:#475569;word-break:break-all">${safeLink}</span></p>
      </div>
    </div>
  </body>
</html>`;
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  // Qué loguear en dev cuando falta RESEND_API_KEY (link de invitación, OTP, etc.).
  devFallbackLog?: string;
}

// Envío genérico vía Resend con retries. Toda pieza de email del sistema (invitaciones,
// reset de contraseña, OTP de 2FA) pasa por acá para compartir auth y retries.
// eez4us.com está verificado en resend.com/domains, así que TODO sale desde EMAIL_FROM
// (tequio-mail@eez4us.com). NO hay fallback a onboarding@resend.dev: ese remitente solo
// entrega al dueño de la cuenta Resend, y un fallback silencioso haría creer que las
// invitaciones se enviaron a los padres cuando en realidad se desviaron. Si el dominio
// dejara de estar verificado, preferimos que el envío falle visible (send-bulk lo reporta
// como failure) a que se desvíe sin avisar.
export async function sendEmail(args: SendEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const baseUrl = (process.env.RESEND_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
       
      console.warn(`[mailer] RESEND_API_KEY ausente — ${args.devFallbackLog ?? `email a ${args.to} (${args.subject})`}`);
      return;
    }
    throw new Error('RESEND_API_KEY no configurado');
  }

  await postResend(baseUrl, apiKey, { from, to: [args.to], subject: args.subject, html: args.html });
}

async function postResend(
  baseUrl: string,
  apiKey: string,
  payload: { from: string; to: string[]; subject: string; html: string },
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/emails`, {
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
      throw new Error(`Resend ${res.status}: ${detail || 'envío rechazado'}`);
    }
    lastError = new Error(`Resend ${res.status}: ${detail || 'error transitorio'}`);
    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, 250 * 2 ** attempt));
    }
  }

  throw lastError ?? new Error('Resend: reintentos agotados');
}

export async function sendInvitationEmail(args: InvitationEmailArgs): Promise<void> {
  const m = MAIL_M[args.locale ?? DEFAULT_LOCALE];
  await sendEmail({
    to: args.email,
    subject: m.invitationSubject,
    html: renderInvitationHtml(args),
    devFallbackLog: `invite link para ${args.email}: ${args.link}`,
  });
}

// Mismo shell visual que la invitación (card blanca, Nunito, botón pill) para todos los mails.
function renderCardHtml(title: string, bodyHtml: string, locale: AppLocale): string {
  return `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;background:#f1f5f9;font-family:'Nunito',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;padding:32px 20px">
      <div style="background:#ffffff;border-radius:24px;padding:32px;box-shadow:0 4px 16px rgba(15,23,42,0.08)">
        <h1 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:800">${title}</h1>
        ${bodyHtml}
      </div>
    </div>
  </body>
</html>`;
}

// Código 2FA del panel (director / super_admin). El código expira en minutos: sin CTA, solo el número.
export async function sendStaffOtpEmail(args: { email: string; otp: string; locale?: AppLocale }): Promise<void> {
  const locale = args.locale ?? DEFAULT_LOCALE;
  const m = MAIL_M[locale];
  const body = `
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.5">${m.otpIntro}</p>
        <p style="margin:0 0 16px;text-align:center"><span style="display:inline-block;background:#f1f5f9;border-radius:16px;padding:14px 28px;color:#0f172a;font-size:32px;font-weight:800;letter-spacing:8px">${escapeHtml(args.otp)}</span></p>
        <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5">${m.otpFooter}</p>`;
  await sendEmail({
    to: args.email,
    subject: m.otpSubject(args.otp),
    html: renderCardHtml(m.otpTitle, body, locale),
    devFallbackLog: `OTP 2FA para ${args.email}: ${args.otp}`,
  });
}

export async function sendResetPasswordEmail(args: { email: string; link: string; locale?: AppLocale }): Promise<void> {
  const locale = args.locale ?? DEFAULT_LOCALE;
  const m = MAIL_M[locale];
  const safeLink = escapeHtml(args.link);
  const body = `
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.5">${m.resetIntro}</p>
        <a href="${safeLink}" style="display:inline-block;background:#22c55e;color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;padding:14px 28px;border-radius:9999px">${m.resetCta}</a>
        <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.5">${m.linkFallback}<br /><span style="color:#475569;word-break:break-all">${safeLink}</span></p>`;
  await sendEmail({
    to: args.email,
    subject: m.resetSubject,
    html: renderCardHtml(m.resetTitle, body, locale),
    devFallbackLog: `reset password link para ${args.email}: ${args.link}`,
  });
}
