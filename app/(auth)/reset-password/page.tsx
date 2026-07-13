'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';

import { LanguageSwitcher } from '@/components/language-switcher';
import { PasswordInput } from '@/components/ui/password-input';

function ResetForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError(t('reset.errors.missingToken'));
      return;
    }
    if (password.length < 8) {
      setError(t('reset.errors.tooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('reset.errors.mismatch'));
      return;
    }
    setPending(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? data.message ?? `HTTP ${res.status}`);
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unexpected'));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-6 rounded-2xl bg-card p-10 shadow-card border text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <div>
          <h1 className="text-xl font-bold">{t('reset.done.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('reset.done.body')}</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-2xl bg-card p-10 shadow-card border"
    >
      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold">{t('reset.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('reset.subtitle')}</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            {t('reset.newPasswordLabel')}
          </label>
          <PasswordInput
            wrapperClassName="mt-1"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            {t('reset.confirmLabel')}
          </label>
          <PasswordInput
            wrapperClassName="mt-1"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-95 disabled:opacity-50"
      >
        {pending ? tCommon('actions.saving') : t('reset.submit')}
      </button>

      <Link
        href="/login"
        className="block text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        {t('backToLogin')}
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  const tCommon = useTranslations('common');
  return (
    <main className="auth-bg relative flex min-h-screen flex-col">
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Suspense
            fallback={
              <div className="text-center text-muted-foreground">{tCommon('states.loading')}</div>
            }
          >
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
