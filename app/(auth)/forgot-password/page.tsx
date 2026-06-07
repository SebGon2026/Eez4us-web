'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      });
      if (!res.ok && res.status >= 500) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? `HTTP ${res.status}`);
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-bg flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {sent ? (
            <div className="space-y-6 rounded-2xl bg-card p-10 shadow-card border text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Revisá tu email</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Si <span className="font-semibold text-foreground">{email}</span> está en
                  nuestro sistema, te enviamos un link para crear una contraseña nueva.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-95"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <div className="space-y-6 rounded-2xl bg-card p-10 shadow-card border">
              <div className="text-center space-y-2">
                <h1 className="text-xl font-bold">Recuperar contraseña</h1>
                <p className="text-sm text-muted-foreground">
                  Te enviamos un link a tu email para resetearla.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="director@colegio.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {error && (
                  <p className="text-sm font-medium text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
                >
                  {pending ? 'Enviando…' : 'Enviar link'}
                  {!pending && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </button>

                <Link
                  href="/login"
                  className="block text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  ← Volver al login
                </Link>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
