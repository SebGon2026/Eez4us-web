'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error boundary:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border-2 border-destructive/30 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto w-fit rounded-3xl bg-destructive/10 p-4">
          <AlertCircle className="size-10 text-destructive" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-foreground">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground">
            No pudimos cargar esta pantalla. Probá de nuevo y si sigue, avisanos.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-3xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition active:scale-[0.98]"
        >
          <RotateCcw className="size-4" />
          Reintentar
        </button>
      </div>
    </main>
  );
}
