import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { intlLocaleOf } from '@/lib/locale';
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

  const t = await getTranslations('schools');
  const dateLocale = intlLocaleOf(await getLocale());

  return (
    <div className="shell-gap">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('settings.subtitle')}</p>
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
          <CardTitle className="text-xl">{t('settings.technicalData')}</CardTitle>
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
            <span className="font-bold">Openpay Customer:</span>{' '}
            <code className="text-xs">{school.openpayCustomerId ?? '—'}</code>
          </p>
          <p>
            <span className="font-bold">{t('settings.statusLabel')}</span>{' '}
            {school.active ? t('settings.active') : t('settings.suspended')}
          </p>
          <p>
            <span className="font-bold">{t('settings.createdLabel')}</span>{' '}
            {new Date(school.createdAt).toLocaleString(dateLocale)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('settings.legal')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-semibold hover:bg-secondary transition-colors"
          >
            {t('settings.privacyPolicy')}
          </a>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-semibold hover:bg-secondary transition-colors"
          >
            {t('settings.termsOfService')}
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
