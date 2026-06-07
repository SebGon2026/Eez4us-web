import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

import { SchoolSettingsForm } from './settings-form';

export default async function SchoolSettingsPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
  });
  if (!school) redirect('/login');

  return (
    <div className="shell-gap">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del colegio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identidad, apariencia, idioma y datos técnicos.
        </p>
      </div>

      <SchoolSettingsForm
        initial={{
          name: school.name,
          internalCode: school.internalCode,
          addressText: school.addressText ?? '',
          addressLat: school.addressLat,
          addressLng: school.addressLng,
          logoUrl: school.logoUrl,
          brandHue: school.brandHue,
          brandHueSecondary: school.brandHueSecondary,
          locale: school.locale,
          density: school.density,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Datos técnicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-bold">ID:</span> <code className="text-xs">{school.id}</code>
          </p>
          <p>
            <span className="font-bold">Stripe Customer:</span>{' '}
            <code className="text-xs">{school.stripeCustomerId ?? '—'}</code>
          </p>
          <p>
            <span className="font-bold">Estado:</span>{' '}
            {school.active ? 'Activo' : 'Suspendido'}
          </p>
          <p>
            <span className="font-bold">Creado:</span>{' '}
            {new Date(school.createdAt).toLocaleString('es-AR')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Legales</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-semibold hover:bg-secondary transition-colors"
          >
            Política de privacidad
          </a>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-semibold hover:bg-secondary transition-colors"
          >
            Términos del servicio
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
