'use client';

import { ArrowRight, KeyRound, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { LanguageSwitcher } from '@/components/language-switcher';
import { PasswordInput } from '@/components/ui/password-input';
import { authClient } from '@/lib/auth-client';

interface SchoolBrand {
  id: string;
  name: string;
  internalCode: string;
  logoUrl: string | null;
  brandHue: number | null;
  active: boolean;
}

const STORAGE_KEY = 'eez4us.lastSchoolCode';

// better-auth limita /two-factor/* a 3 requests por 10 s en producción y el envío
// automático del sign-in ya consume uno. Sin cooldown, dos o tres taps seguidos a
// "Reenviar código" devuelven 429 y la UI moría en un error genérico.
const RESEND_COOLDOWN_S = 30;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function LoginPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const [step, setStep] = useState<'code' | 'creds' | 'otp'>('code');
  const [code, setCode] = useState('');
  const [school, setSchool] = useState<SchoolBrand | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  useEffect(() => {
    const remembered = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (remembered) {
      setCode(remembered);
      lookup(remembered).catch(() => undefined);
    }
  }, []);

  // Evita el bfcache: si el browser restaura esta página desde caché (back/forward),
  // forzamos un reload para que el middleware re-evalúe la sesión.
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) window.location.reload();
    }
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  async function lookup(rawCode: string): Promise<void> {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(
        `/api/public/school-lookup?code=${encodeURIComponent(rawCode.trim().toUpperCase())}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === 'NOT_FOUND' ? t('login.code.notFound') : t('login.code.invalid'),
        );
        return;
      }
      setSchool(data.school as SchoolBrand);
      setStep('creds');
      localStorage.setItem(STORAGE_KEY, data.school.internalCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unexpected'));
    } finally {
      setPending(false);
    }
  }

  async function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    await lookup(code);
  }

  async function onSubmitCreds(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? t('login.creds.signInFallback'));
        return;
      }
      // Staff con 2FA: better-auth no crea sesión todavía, pide el código por email.
      if ((result.data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
        const sent = await authClient.twoFactor.sendOtp();
        if (sent.error) {
          setError(t('login.otp.sendFailed'));
          return;
        }
        setOtp('');
        setNotice(null);
        // El envío automático de recién cuenta para el rate limit: arrancamos en cooldown.
        setResendCooldown(RESEND_COOLDOWN_S);
        setStep('otp');
        return;
      }
      // Hard navigation: evita el flicker de back/forward cache y la cadena
      // /login → / → /admin. El server-side router resuelve todo en una sola pasada.
      window.location.replace('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unexpected'));
    } finally {
      setPending(false);
    }
  }

  async function onSubmitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await authClient.twoFactor.verifyOtp({ code: otp.trim(), trustDevice });
      if (result.error) {
        if (result.error.code === 'INVALID_TWO_FACTOR_COOKIE') {
          expireToCreds();
          return;
        }
        setError(t('login.otp.invalidOrExpired'));
        return;
      }
      window.location.replace('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unexpected'));
    } finally {
      setPending(false);
    }
  }

  // La ventana 2FA (cookie + verification de 10 min) venció: el server ya no sabe quién
  // pidió el código, así que reenviar/verificar es imposible por diseño. Volvemos a
  // credenciales para re-emitir el desafío en vez de dejar al usuario en un paso muerto.
  function expireToCreds() {
    setStep('creds');
    setOtp('');
    setNotice(null);
    setResendCooldown(0);
    setError(t('login.otp.sessionExpired'));
  }

  async function resendOtp() {
    if (resendPending || resendCooldown > 0) return;
    setError(null);
    setNotice(null);
    setResendPending(true);
    try {
      const sent = await authClient.twoFactor.sendOtp();
      if (sent.error) {
        if (sent.error.code === 'INVALID_TWO_FACTOR_COOKIE' || sent.error.status === 401) {
          expireToCreds();
          return;
        }
        if (sent.error.status === 429) {
          // Ventana del rate limit de better-auth: 10 s.
          setResendCooldown(10);
          setError(t('login.otp.resendThrottled'));
          return;
        }
        setError(t('login.otp.resendFailed'));
        return;
      }
      setNotice(t('login.otp.resent'));
      setResendCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unexpected'));
    } finally {
      setResendPending(false);
    }
  }

  function switchSchool() {
    localStorage.removeItem(STORAGE_KEY);
    setSchool(null);
    setCode('');
    setStep('code');
    setError(null);
  }

  const brandStyle = useMemo<React.CSSProperties>(() => {
    if (!school?.brandHue) return {};
    return {
      ['--primary' as never]: `${school.brandHue} 55% 36%`,
      ['--ring' as never]: `${school.brandHue} 55% 36%`,
    };
  }, [school?.brandHue]);

  return (
    <main style={brandStyle} className="auth-bg relative flex min-h-screen flex-col">
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {step === 'code' ? (
            <div className="space-y-8 rounded-2xl bg-card p-10 shadow-pop border border-border">
              <div className="text-center space-y-3">
                <Image
                  src="/logo.png"
                  alt="Eez4us"
                  width={180}
                  height={90}
                  priority
                  className="mx-auto h-auto w-[180px]"
                />
                <h1 className="text-xl font-bold text-foreground">{t('login.code.title')}</h1>
              </div>

              <form onSubmit={onSubmitCode} className="space-y-5">
                <div className="flex items-center rounded-lg border border-input bg-white px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
                  <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="ABC123"
                    value={code.toUpperCase()}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())
                    }
                    autoFocus
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    className="ml-2 w-full bg-transparent py-3 text-sm font-bold tracking-widest outline-none placeholder:text-muted-foreground/50 placeholder:font-normal placeholder:tracking-normal"
                  />
                </div>

                {error && (
                  <p className="text-sm font-medium text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={pending || !code.trim()}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
                >
                  {pending ? t('login.code.searching') : t('login.code.continue')}
                  {!pending && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </button>

                <p className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setHelpOpen(true)}
                    className="font-semibold text-primary hover:underline"
                  >
                    {t('login.code.whereIsMyCode')}
                  </button>
                </p>
              </form>
            </div>
          ) : step === 'otp' ? (
            <div className="space-y-8 rounded-2xl bg-card p-10 shadow-pop border border-border">
              <div className="text-center space-y-3">
                <Image
                  src="/logo.png"
                  alt="Eez4us"
                  width={180}
                  height={90}
                  priority
                  className="mx-auto h-auto w-[180px]"
                />
                <div>
                  <h1 className="text-xl font-bold text-foreground">{t('login.otp.title')}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.rich('login.otp.sentTo', {
                      email,
                      strong: (chunks) => (
                        <span className="font-semibold text-foreground">{chunks}</span>
                      ),
                    })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('login.otp.hint')}</p>
                </div>
              </div>

              <form onSubmit={onSubmitOtp} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  placeholder="000000"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  className="w-full rounded-lg border border-input bg-white px-3 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                />

                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                  />
                  {t('login.otp.trustDevice')}
                </label>

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                {notice && !error && (
                  <p className="text-sm font-medium text-primary">{notice}</p>
                )}

                <button
                  type="submit"
                  disabled={pending || otp.length !== 6}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
                >
                  {pending ? t('login.otp.verifying') : t('login.otp.verify')}
                </button>

                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resendPending || resendCooldown > 0}
                  className="block w-full text-center text-xs font-semibold text-primary hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
                >
                  {resendPending
                    ? t('login.otp.resending')
                    : resendCooldown > 0
                      ? t('login.otp.resendCountdown', { seconds: resendCooldown })
                      : t('login.otp.resend')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('creds');
                    setOtp('');
                    setError(null);
                    setNotice(null);
                    setResendCooldown(0);
                  }}
                  className="block w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('login.otp.back')}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8 rounded-2xl bg-card p-10 shadow-pop border border-border">
              <div className="text-center space-y-3">
                {school?.logoUrl ? (
                  <img
                    src={school.logoUrl}
                    alt={school.name}
                    className="mx-auto h-20 w-auto max-w-[200px] object-contain"
                  />
                ) : (
                  <div
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black text-primary-foreground"
                    style={{ background: 'hsl(var(--primary))' }}
                  >
                    {initials(school?.name ?? 'EE')}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-foreground">{school?.name}</h1>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-1">
                    {t.rich('login.creds.codeLabel', {
                      code: school?.internalCode ?? '',
                      mono: (chunks) => (
                        <span className="font-mono font-bold text-foreground">{chunks}</span>
                      ),
                    })}
                  </p>
                </div>
              </div>

              <form onSubmit={onSubmitCreds} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    {tCommon('fields.email')}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={t('emailPlaceholder')}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">
                      {tCommon('fields.password')}
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {t('login.creds.forgotPassword')}
                    </Link>
                  </div>
                  <PasswordInput
                    wrapperClassName="mt-1"
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-sm font-medium text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
                >
                  {pending ? t('login.creds.submitting') : t('login.creds.submit')}
                </button>

                <button
                  type="button"
                  onClick={switchSchool}
                  className="block w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('login.creds.switchSchool')}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Modal "¿Dónde consigo mi código?" */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-elev"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              aria-label={tCommon('actions.close')}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>

            <Image
              src="/logo.png"
              alt="Eez4us"
              width={130}
              height={65}
              className="mx-auto h-auto w-[130px]"
            />

            <h2 className="mt-4 text-center text-lg font-bold">{t('login.help.title')}</h2>

            <div className="mt-5 flex justify-center">
              <div className="flex items-center gap-2 rounded-lg border-2 border-primary bg-white px-4 py-2">
                <KeyRound className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-mono text-base font-bold tracking-widest text-foreground">
                  ABC123
                </span>
              </div>
            </div>

            <p className="mt-2 text-center text-xs font-semibold text-primary">
              {t('login.help.caption')}
            </p>

            <p className="mt-4 text-center text-sm text-muted-foreground leading-relaxed">
              {t.rich('login.help.body1', {
                strong: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
              })}
            </p>
            <p className="mt-2 text-center text-sm text-muted-foreground leading-relaxed">
              {t.rich('login.help.body2', {
                strong: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
              })}
            </p>

            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="mt-6 w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-95"
            >
              {tCommon('actions.understood')}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
