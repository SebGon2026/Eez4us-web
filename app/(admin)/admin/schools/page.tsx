import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function SchoolsAdminPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/admin');
  const t = await getTranslations('schools');
  const tCommon = await getTranslations('common');

  const schools = await prisma.school.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: true,
      _count: {
        select: {
          users: true,
          students: true,
          pickupPoints: true,
          trips: true,
        },
      },
    },
  });

  const totals = {
    schools: schools.length,
    active: schools.filter((s) => s.active).length,
    students: schools.reduce((acc, s) => acc + s._count.students, 0),
    users: schools.reduce((acc, s) => acc + s._count.users, 0),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black">{t('list.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('list.subtitle')}</p>
        </div>
        <Link href="/admin/schools/new">
          <Button>{t('list.addSchool')}</Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground font-bold">
              {t('list.kpiSchools')}
            </p>
            <p className="text-3xl font-black">{totals.schools}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground font-bold">
              {t('list.kpiActive')}
            </p>
            <p className="text-3xl font-black">{totals.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground font-bold">
              {tCommon('fields.students')}
            </p>
            <p className="text-3xl font-black">{totals.students}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground font-bold">
              {t('list.kpiUsers')}
            </p>
            <p className="text-3xl font-black">{totals.users}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('list.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {schools.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('list.empty')}</p>
          ) : (
            <ul className="divide-y text-sm">
              {schools.map((s) => {
                const monthlyRevenue =
                  s.subscription && ['ACTIVE', 'PAST_DUE'].includes(s.subscription.status)
                    ? s._count.students * s.subscription.pricePerStudent
                    : 0;
                const location = [s.city, s.country].filter(Boolean).join(', ');
                return (
                <li key={s.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">
                        {s.name}{' '}
                        {location && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {location}
                          </span>
                        )}
                        {!s.active && (
                          <span className="ml-2 rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-bold text-destructive">
                            {t('list.suspended')}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('codeLabel')} <code>{s.internalCode}</code> ·{' '}
                        {t('list.studentsCount', { count: s._count.students })} ·{' '}
                        {t('list.usersCount', { count: s._count.users })} ·{' '}
                        {t('list.tripsCount', { count: s._count.trips })} ·{' '}
                        {s.subscription?.status ?? t('list.noSubscription')} ·{' '}
                        <span className="font-bold text-emerald-700">
                          ${monthlyRevenue.toLocaleString('en-US')} {t('list.perMonth')}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <form
                        action={`/api/admin/schools/${s.id}/impersonate`}
                        method="POST"
                      >
                        <Button type="submit" variant="outline" size="sm">
                          {t('viewAsDirector')}
                        </Button>
                      </form>
                      <Link href={`/admin/schools/${s.id}`}>
                        <Button variant="outline" size="sm">
                          {t('list.detail')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
