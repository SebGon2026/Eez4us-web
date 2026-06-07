'use client';

import { useEffect } from 'react';

import { authClient } from '@/lib/auth-client';

export default function DevLogoutPage() {
  useEffect(() => {
    (async () => {
      try {
        await authClient.signOut();
      } catch {
        // ignore
      }
      // Limpiamos también el código de colegio recordado.
      try {
        localStorage.removeItem('eez4us.lastSchoolCode');
      } catch {
        // ignore
      }
      window.location.replace('/login');
    })();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm font-bold text-muted-foreground">Cerrando sesión…</p>
    </main>
  );
}
