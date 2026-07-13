import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { AdminShell } from '@/components/admin/admin-shell';
import { BillingLockScreen } from '@/components/admin/billing-lock-screen';
import { isBillingLocked, resolveProvider } from '@/lib/billing';
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
  let billingLocked = false;
  let lockProvider: 'openpay' | 'stripe' = 'stripe';
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
        country: true,
        currency: true,
        subscription: {
          select: {
            status: true,
            gracePeriodDays: true,
            pastDueSince: true,
            updatedAt: true,
          },
        },
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
    lockProvider = resolveProvider(school ?? { country: null, currency: null });
    // Corte duro SOLO para el director y SOLO pasada la gracia. El support_staff/logistics
    // no se bloquean para no cortar la operación del portón (decisión: bloqueo de panel, no
    // de tracking). Dentro de la gracia sigue el banner.
    billingLocked =
      session.user.role === 'director' && isBillingLocked(school?.subscription ?? null);
  }

  const t = await getTranslations('nav');

  // Trial vencido / pago pendiente DENTRO de la gracia: solo AVISA (banner). Pasada la gracia
  // se muestra el takeover de pago (billingLocked) en lugar del contenido.
  const billingBanner = pastDue ? (
    <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-center text-sm font-semibold text-destructive">
      {t.rich('billingBanner.message', {
        link: (chunks) => (
          <Link href="/admin/billing" className="underline font-bold">
            {chunks}
          </Link>
        ),
      })}
    </div>
  ) : null;

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
      >
        {billingBanner}
        {billingLocked ? <BillingLockScreen provider={lockProvider} /> : children}
      </AdminShell>
    </div>
  );
}
