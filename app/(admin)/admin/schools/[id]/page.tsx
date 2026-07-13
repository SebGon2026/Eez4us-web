import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { TrialEditor } from '@/components/admin/trial-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { intlLocaleOf } from '@/lib/locale';
import { getCurrentSession } from '@/lib/session';

import { SchoolActions } from './school-actions';

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/admin');

  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      subscription: true,
      users: {
        where: { role: { in: ['director', 'support_staff'] } },
        select: { id: true, name: true, email: true, role: true },
      },
      _count: {
        select: {
          students: true,
          trips: true,
          pickupPoints: true,
          invitations: true,
        },
      },
    },
  });
  if (!school) notFound();

  const [parentsCount, vehiclesCount] = await Promise.all([
    prisma.user.count({ where: { schoolId: id, role: 'parent', active: true } }),
    prisma.vehicle.count({ where: { active: true, parent: { schoolId: id, role: 'parent' } } }),
  ]);

  const t = await getTranslations('schools');
  const tCommon = await getTranslations('common');
  const dateLocale = intlLocaleOf(await getLocale());

  return (
    <div className="space-y-6">
      <Link href="/admin/schools" className="text-sm font-bold text-primary hover:underline">
        {t('detail.back')}
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black">{school.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t('codeLabel')} <code>{school.internalCode}</code>
            {(school.city || school.country) && (
              <> · {[school.city, school.country].filter(Boolean).join(', ')}</>
            )}
          </p>
        </div>
        <SchoolActions schoolId={school.id} active={school.active} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { l: tCommon('fields.students'), v: school._count.students },
          { l: t('detail.parents'), v: parentsCount },
          { l: t('detail.vehicles'), v: vehiclesCount },
          { l: t('detail.trips'), v: school._count.trips },
          { l: t('detail.pickupPoints'), v: school._count.pickupPoints },
          { l: t('detail.invitations'), v: school._count.invitations },
        ].map((c) => (
          <Card key={c.l}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase text-muted-foreground font-bold">{c.l}</p>
              <p className="text-2xl font-black">{c.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('detail.staff')}</CardTitle>
        </CardHeader>
        <CardContent>
          {school.users.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('detail.noStaff')}</p>
          ) : (
            <ul className="divide-y text-sm">
              {school.users.map((u) => (
                <li key={u.id} className="py-2">
                  <p className="font-bold">{u.name ?? u.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.email} · {u.role}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('detail.subscription')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {school.subscription ? (
            <>
              <p>
                {t('detail.statusLabel')}{' '}
                <span className="font-bold">{school.subscription.status}</span>
                {school.subscription.status === 'PAST_DUE' && (
                  <span className="ml-2 text-xs font-bold text-destructive">
                    {t('detail.pastDueHint')}
                  </span>
                )}
              </p>
              <p>
                {t('detail.pricePerStudent', {
                  price: school.subscription.pricePerStudent,
                  currency: school.subscription.currency,
                })}
              </p>
              {school.subscription.trialEndsAt && (
                <p>
                  {t('detail.trialUntil')}{' '}
                  <span className="font-bold">
                    {new Date(school.subscription.trialEndsAt).toLocaleDateString(dateLocale)}
                  </span>
                  {new Date(school.subscription.trialEndsAt).getTime() < Date.now() && (
                    <span className="ml-1 text-xs text-destructive">{t('detail.expired')}</span>
                  )}
                </p>
              )}
              {school.subscription.nextChargeAt && (
                <p>
                  {t('detail.nextCharge')}{' '}
                  {new Date(school.subscription.nextChargeAt).toLocaleDateString(dateLocale)}
                </p>
              )}
              {school.subscription.currentPeriodEnd && (
                <p>
                  {t('detail.currentPeriodUntil')}{' '}
                  {new Date(school.subscription.currentPeriodEnd).toLocaleDateString(dateLocale)}
                </p>
              )}
              <TrialEditor schoolId={school.id} />
            </>
          ) : (
            <p className="text-muted-foreground">{t('detail.noSubscription')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
