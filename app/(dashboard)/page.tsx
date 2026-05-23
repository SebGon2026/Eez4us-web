import { redirect } from 'next/navigation';

import { getCurrentSession } from '@/lib/session';

const STAFF_ROLES = new Set(['director', 'support_staff', 'super_admin']);

export default async function RootPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (STAFF_ROLES.has(session.user.role)) redirect('/admin');

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-3xl font-black text-primary">Eez4us</h1>
        <p className="text-sm text-muted-foreground">
          Usá la app móvil para ver tu invitación y tus viajes. Esta web es solo para el equipo
          de la escuela.
        </p>
      </div>
    </main>
  );
}
