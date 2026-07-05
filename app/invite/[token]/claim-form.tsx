'use client';

import { CheckCircle2, GraduationCap, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';

import { LanguageSwitcher } from '@/components/language-switcher';
import { PasswordInput } from '@/components/ui/password-input';
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

const CLAIM_ERROR_CODES = new Set([
  'PHONE_INVALID',
  'INVITATION_ALREADY_USED',
  'INVITATION_EXPIRED',
  'INVITATION_NOT_FOUND',
  'SIGNUP_FAILED',
]);

export function ClaimInvitation({
  token,
  state,
  schoolName,
  schoolCountry,
  parentName,
  studentNames = [],
  loginEmail,
}: Props) {
  const t = useTranslations('invitations.claim');
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
      setError(t('validation.passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('validation.passwordMismatch'));
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
        setError(
          CLAIM_ERROR_CODES.has(data.error)
            ? t(`errors.${data.error}`, { prefix })
            : t('errors.fallback'),
        );
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unexpected'));
    } finally {
      setPending(false);
    }
  }

  const card = 'space-y-6 rounded-2xl bg-card p-8 sm:p-10 shadow-pop border border-border';

  if (state !== 'READY') {
    return (
      <main className="auth-bg relative flex min-h-screen items-center justify-center px-4 py-8">
        <LanguageSwitcher className="absolute right-4 top-4 z-10" />
        <div className={`w-full max-w-md text-center ${card}`}>
          <Image src="/logo.png" alt="Eez4us" width={160} height={80} priority className="mx-auto h-auto w-[160px]" />
          <h1 className="text-xl font-bold text-foreground">{t(`dead.${state}.title`)}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{t(`dead.${state}.body`)}</p>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="auth-bg relative flex min-h-screen items-center justify-center px-4 py-8">
        <LanguageSwitcher className="absolute right-4 top-4 z-10" />
        <div className={`w-full max-w-md ${card}`}>
          <div className="text-center space-y-3">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h1 className="text-2xl font-black text-foreground">{t('done.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t.rich('done.subtitle', {
                count: studentNames.length,
                school: schoolName ?? '',
                b: (chunks) => <span className="font-bold text-foreground">{chunks}</span>,
              })}
            </p>
          </div>

          <ol className="space-y-3 text-sm">
            <li className="flex gap-3 rounded-xl border border-border bg-secondary/40 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">1</span>
              <span>
                {t.rich('done.step1', {
                  apk: (chunks) => (
                    <a href={APK_URL} className="font-bold text-primary underline break-all">
                      {chunks}
                    </a>
                  ),
                })}
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-border bg-secondary/40 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">2</span>
              <span>
                {t.rich('done.step2', {
                  email: loginEmail ?? '',
                  mono: (chunks) => (
                    <span className="font-mono font-bold text-foreground break-all">{chunks}</span>
                  ),
                })}
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-border bg-secondary/40 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">3</span>
              <span>{t('done.step3')}</span>
            </li>
          </ol>

          <a
            href={`eez4us://invite/${token}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-6 py-3 text-sm font-bold text-primary transition-all hover:bg-primary/5"
          >
            <Smartphone className="h-4 w-4" />
            {t('done.haveApp')}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-bg relative flex min-h-screen items-center justify-center px-4 py-8">
      <LanguageSwitcher className="absolute right-4 top-4 z-10" />
      <div className={`w-full max-w-md ${card}`}>
        <div className="text-center space-y-3">
          <Image src="/logo.png" alt="Eez4us" width={160} height={80} priority className="mx-auto h-auto w-[160px]" />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {parentName ? t('hello', { name: parentName }) : t('helloAnon')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.rich('intro', {
                school: schoolName ?? '',
                b: (chunks) => <span className="font-bold text-foreground">{chunks}</span>,
              })}
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
            <label className="text-xs font-semibold text-muted-foreground">{t('form.name')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{t('form.password')}</label>
            <PasswordInput
              wrapperClassName="mt-1"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{t('form.confirm')}</label>
            <PasswordInput
              wrapperClassName="mt-1"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              {t('form.phone', { prefix })}
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
            {pending ? t('form.submitting') : t('form.submit')}
          </button>
        </form>
      </div>
    </main>
  );
}
