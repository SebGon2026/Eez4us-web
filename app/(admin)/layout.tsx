import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/admin-shell';
import { billingBlockEnabled } from '@/lib/billing';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

const STAFF_ROLES = new Set(['director', 'support_staff', 'super_admin']);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (!STAFF_ROLES.has(session.user.role)) redirect('/login');

  // Cuenta dada de baja por el director: corta el acceso al panel.
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { active: true },
  });
  if (me && !me.active) redirect('/login');

  let schoolName: string | null = null;
  let schoolLogo: string | null = null;
  let internalCode: string | null = null;
  let density: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  let primaryHue = 142;
  let accentHue = 142;
  let pastDue = false;
  if (session.user.schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: session.user.schoolId },
      select: {
        name: true,
        logoUrl: true,
        internalCode: true,
        density: true,
        brandHue: true,
        brandHueSecondary: true,
        subscription: { select: { status: true } },
      },
    });
    schoolName = school?.name ?? null;
    schoolLogo = school?.logoUrl ?? null;
    internalCode = school?.internalCode ?? null;
    if (school?.density === 'compact' || school?.density === 'spacious') {
      density = school.density;
    }
    primaryHue = school?.brandHue ?? 142;
    accentHue = school?.brandHueSecondary ?? school?.brandHue ?? 142;
    pastDue = school?.subscription?.status === 'PAST_DUE';
  }

  // Trial vencido / pago pendiente: hoy solo AVISA (banner). El corte duro está detrás de
  // BILLING_BLOCK_ON_PAST_DUE (apagado — decisión de producto pendiente: avisar vs bloquear).
  const billingBanner = pastDue ? (
    <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-center text-sm font-semibold text-destructive">
      El periodo de prueba terminó y no hay un método de pago activo.{' '}
      <Link href="/admin/billing" className="underline font-bold">
        Cargar tarjeta
      </Link>{' '}
      para mantener el servicio.
    </div>
  ) : null;

  if (pastDue && billingBlockEnabled() && session.user.role === 'director') {
    // x-pathname lo inyecta el middleware. Sin header (fail-open) no bloqueamos, y
    // /admin/billing queda accesible para poder cargar la tarjeta.
    const pathname = (await headers()).get('x-pathname');
    if (pathname && !pathname.startsWith('/admin/billing')) {
      redirect('/admin/billing');
    }
  }

  // Theming por colegio: primario (chrome/sidebar) + acento (íconos, bandas)
  const brandStyle = {
    ['--primary' as string]: `${primaryHue} 55% 36%`,
    ['--ring' as string]: `${primaryHue} 55% 36%`,
    ['--brand-accent' as string]: `${accentHue} 62% 45%`,
  } as React.CSSProperties;

  return (
    <div
      data-density={density}
      style={brandStyle}
      className="h-screen overflow-hidden bg-background"
    >
      <AdminShell
        userName={session.user.name}
        role={session.user.role}
        schoolName={schoolName}
        schoolLogo={schoolLogo}
        internalCode={internalCode}
        hasSchool={!!session.user.schoolId}
      >
        {billingBanner}
        {children}
      </AdminShell>
    </div>
  );
}
