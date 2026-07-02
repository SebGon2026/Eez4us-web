'use client';

import { CheckCircle2, GraduationCap, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { dialPrefixForCountry } from '@/lib/phone';

// APK de producción publicado por el equipo mobile (v0.1.0).
const APK_URL = 'https://files.catbox.moe/ee0l64.apk';

type PageState = 'READY' | 'CLAIMED' | 'EXPIRED' | 'REVOKED' | 'NOT_FOUND';

interface Props {
  token: string;
  state: PageState;
  schoolName?: string;
  schoolCountry?: string | null;
  parentName?: string | null;
  studentNames?: string[];
  loginEmail?: string;
}

const DEAD_STATES: Record<Exclude<PageState, 'READY'>, { title: string; body: string }> = {
  CLAIMED: {
    title: 'Esta invitación ya fue usada',
    body: 'Tu cuenta ya está creada. Abrí la app de Eez4us y entrá con tu email y contraseña. Si no la recordás, usá "¿La olvidaste?" en la app.',
  },
  EXPIRED: {
    title: 'Esta invitación venció',
    body: 'Pedile a la escuela que te reenvíe una invitación nueva.',
  },
  REVOKED: {
    title: 'Esta invitación fue revocada',
    body: 'Pedile a la escuela que te genere una invitación nueva.',
  },
  NOT_FOUND: {
    title: 'Invitación no encontrada',
    body: 'El link no es válido. Revisá que lo hayas copiado completo o pedile uno nuevo a la escuela.',
  },
};

export function ClaimInvitation({
  token,
  state,
  schoolName,
  schoolCountry,
  parentName,
  studentNames = [],
  loginEmail,
}: Props) {
  const prefix = dialPrefixForCountry(schoolCountry) ?? '+';
  const [name, setName] = useState(parentName ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    // A E.164 estricto: el server valida /^\+[1-9]\d{6,14}$/, sin espacios ni guiones.
    const phoneClean = phone.replace(/[\s-]/g, '');
    setPending(true);
    try {
      const res = await fetch('/api/auth/claim-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          name: name.trim(),
          ...(phoneClean ? { phoneE164: phoneClean.startsWith('+') ? phoneClean : `${prefix}${phoneClean}` } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs: Record<string, string> = {
          PHONE_INVALID: `El teléfono no es válido para el país de la escuela (prefijo ${prefix}).`,
          INVITATION_ALREADY_USED: 'Esta invitación ya fue usada.',
          INVITATION_EXPIRED: 'Esta invitación venció. Pedí una nueva a la escuela.',
          INVITATION_NOT_FOUND: 'Invitación no encontrada.',
          SIGNUP_FAILED: 'No pudimos crear la cuenta. Puede que ya exista una con este email.',
        };
        setError(msgs[data.error] ?? 'No pudimos crear tu cuenta. Intentá de nuevo.');
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setPending(false);
    }
  }

  const card = 'space-y-6 rounded-2xl bg-card p-8 sm:p-10 shadow-pop border border-border';

  if (state !== 'READY') {
    const dead = DEAD_STATES[state];
    return (
      <main className="auth-bg flex min-h-screen items-center justify-center px-4 py-8">
        <div className={`w-full max-w-md text-center ${card}`}>
          <Image src="/logo.png" alt="Eez4us" width={160} height={80} priority className="mx-auto h-auto w-[160px]" />
          <h1 className="text-xl font-bold text-foreground">{dead.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{dead.body}</p>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="auth-bg flex min-h-screen items-center justify-center px-4 py-8">
        <div className={`w-full max-w-md ${card}`}>
          <div className="text-center space-y-3">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h1 className="text-2xl font-black text-foreground">¡Cuenta creada!</h1>
            <p className="text-sm text-muted-foreground">
              Ya podés coordinar la recogida de {studentNames.length > 1 ? 'tus hijos' : 'tu hijo'} con{' '}
              <span className="font-bold text-foreground">{schoolName}</span>.
            </p>
          </div>

          <ol className="space-y-3 text-sm">
            <li className="flex gap-3 rounded-xl border border-border bg-secondary/40 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">1</span>
              <span>
                Descargá la app de Eez4us en tu Android:{' '}
                <a href={APK_URL} className="font-bold text-primary underline break-all">
                  descargar APK
                </a>{' '}
                (permití &quot;instalar de fuentes desconocidas&quot; si te lo pide).
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-border bg-secondary/40 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">2</span>
              <span>
                Abrila y entrá con el email{' '}
                <span className="font-mono font-bold text-foreground break-all">{loginEmail}</span> y la
                contraseña que acabás de crear.
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-border bg-secondary/40 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">3</span>
              <span>Cuando vayas a buscarlo al colegio, tocá &quot;Voy en camino&quot; y listo.</span>
            </li>
          </ol>

          <a
            href={`eez4us://invite/${token}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-6 py-3 text-sm font-bold text-primary transition-all hover:bg-primary/5"
          >
            <Smartphone className="h-4 w-4" />
            Ya tengo la app instalada
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-bg flex min-h-screen items-center justify-center px-4 py-8">
      <div className={`w-full max-w-md ${card}`}>
        <div className="text-center space-y-3">
          <Image src="/logo.png" alt="Eez4us" width={160} height={80} priority className="mx-auto h-auto w-[160px]" />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {parentName ? `Hola ${parentName}` : 'Hola'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{schoolName}</span> te invitó a coordinar la
              recogida con Eez4us. Creá tu cuenta para empezar.
            </p>
          </div>
          {studentNames.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {studentNames.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Tu nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Contraseña (mínimo 8)</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Repetí la contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Teléfono (opcional, {prefix}…)
            </label>
            <input
              type="tel"
              placeholder={`${prefix} 555 123 4567`}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ''))}
              className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
          >
            {pending ? 'Creando cuenta…' : 'Crear mi cuenta'}
          </button>
        </form>
      </div>
    </main>
  );
}
