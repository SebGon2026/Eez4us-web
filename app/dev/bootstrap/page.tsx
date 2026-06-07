'use client';

import { useState } from 'react';

interface BootstrapResult {
  ok?: boolean;
  credentials?: Record<string, { email: string; password: string }>;
  school?: { id: string; name: string; code: string };
  counts?: Record<string, number>;
  nextStep?: string;
  error?: string;
}

export default function BootstrapPage() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<BootstrapResult | null>(null);

  async function run() {
    setPending(true);
    try {
      const res = await fetch('/api/dev/bootstrap', { method: 'POST' });
      setResult((await res.json()) as BootstrapResult);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Error' });
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-xl space-y-6 rounded-3xl border-2 bg-card p-8 shadow-lg">
        <div>
          <h1 className="text-3xl font-black text-primary">Bootstrap Demo</h1>
          <p className="text-sm text-muted-foreground">
            Crea (o re-sincroniza) el colegio demo + usuarios + datos de prueba.
          </p>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="w-full rounded-2xl bg-primary px-6 py-4 text-base font-black text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Cargando datos demo…' : 'Crear / reset datos demo'}
        </button>

        {result?.error && (
          <p className="rounded-2xl border-2 border-destructive bg-destructive/5 p-3 text-sm text-destructive">
            {result.error}
          </p>
        )}

        {result?.ok && (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-green-200 bg-green-50/40 p-4">
              <p className="text-sm font-bold text-green-900">¡Datos demo listos!</p>
              {result.school && (
                <p className="text-xs text-green-900/80 mt-1">
                  Colegio: <span className="font-bold">{result.school.name}</span> · Código{' '}
                  <code>{result.school.code}</code>
                </p>
              )}
            </div>

            {result.credentials && (
              <div>
                <p className="font-bold text-sm uppercase mb-2">Credenciales</p>
                <ul className="space-y-2 text-sm">
                  {Object.entries(result.credentials).map(([role, c]) => (
                    <li key={role} className="rounded-xl bg-secondary p-3">
                      <p className="text-xs uppercase font-bold text-muted-foreground">{role}</p>
                      <p>
                        <code>{c.email}</code> / <code>{c.password}</code>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.counts && (
              <div>
                <p className="font-bold text-sm uppercase mb-2">Contadores</p>
                <ul className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(result.counts).map(([k, v]) => (
                    <li key={k} className="rounded-xl bg-secondary p-2">
                      <span className="text-muted-foreground">{k}: </span>
                      <span className="font-bold">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <a
              href="/login"
              className="block w-full rounded-2xl border-2 border-primary px-6 py-4 text-center text-base font-black text-primary hover:bg-primary/5"
            >
              Ir a /login
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
