import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function SuperDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/admin');

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalSchools,
    activeSchools,
    pausedSchools,
    totalStudents,
    activeSubs,
    trialingSubs,
    pastDueSubs,
    activeTrips,
    last7Trips,
    schoolGeo,
    studentsBySchool,
    pushDevices,
    deliveredTrips30d,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.school.count({ where: { active: true } }),
    prisma.school.count({ where: { active: false } }),
    prisma.student.count({ where: { active: true } }),
    prisma.subscription.findMany({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { status: 'TRIALING' } }),
    prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
    prisma.trip.count({ where: { status: { in: ['EN_CAMINO', 'EN_ZONA'] } } }),
    prisma.trip.count({
      where: {
        startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.school.findMany({ select: { city: true, country: true } }),
    prisma.student.groupBy({
      by: ['schoolId'],
      where: { active: true },
      _count: { _all: true },
    }),
    prisma.pushToken.findMany({
      distinct: ['userId', 'platform'],
      select: { platform: true },
    }),
    prisma.trip.findMany({
      where: {
        status: 'ENTREGADO',
        origin: 'EN_CAMINO',
        deliveredAt: { not: null },
        startedAt: { gte: since30d },
      },
      select: { startedAt: true, deliveredAt: true },
    }),
  ]);

  // MRR = alumnos activos × price_per_student por cada colegio con sub activa
  const studentsCountBySchool = new Map(
    studentsBySchool.map((s) => [s.schoolId, s._count._all]),
  );
  const mrr = activeSubs.reduce(
    (acc, s) => acc + (studentsCountBySchool.get(s.schoolId) ?? 0) * s.pricePerStudent,
    0,
  );

  const countries = new Set(schoolGeo.map((s) => s.country).filter(Boolean));
  const cities = new Set(
    schoolGeo.filter((s) => s.city).map((s) => `${s.city}|${s.country ?? ''}`),
  );
  const iosUsers = pushDevices.filter((d) => d.platform === 'ios').length;
  const androidUsers = pushDevices.filter((d) => d.platform === 'android').length;

  const avgPickupMinutes = deliveredTrips30d.length
    ? Math.round(
        deliveredTrips30d.reduce(
          (acc, t) => acc + (t.deliveredAt!.getTime() - t.startedAt.getTime()),
          0,
        ) /
          deliveredTrips30d.length /
          60000 *
          10,
      ) / 10
    : null;

  const t = await getTranslations('schools');

  const stats = [
    { key: 'totalSchools', value: totalSchools },
    { key: 'activeSchools', value: activeSchools },
    { key: 'suspendedSchools', value: pausedSchools },
    { key: 'totalStudents', value: totalStudents },
    { key: 'countries', value: countries.size },
    { key: 'cities', value: cities.size },
    { key: 'activeSubs', value: activeSubs.length },
    { key: 'trialing', value: trialingSubs },
    { key: 'pastDue', value: pastDueSubs },
    { key: 'tripsNow', value: activeTrips },
    { key: 'tripsLast7d', value: last7Trips },
    {
      key: 'avgPickup30d',
      value: avgPickupMinutes == null ? '—' : `${avgPickupMinutes} min`,
    },
    { key: 'iosUsers', value: iosUsers },
    { key: 'androidUsers', value: androidUsers },
    { key: 'mrr', value: `$${mrr.toFixed(0)}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('super.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('super.subtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.key}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase font-bold text-muted-foreground">
                {t(`super.stats.${s.key}`)}
              </p>
              <p className="text-3xl font-black">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('super.notes')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>{t('super.note1')}</p>
          <p>{t('super.note2')}</p>
          <p>{t('super.note3')}</p>
          <p>{t('super.note4')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
