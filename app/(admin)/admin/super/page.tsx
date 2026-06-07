import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function SuperDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/admin');

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
  ]);

  // MRR aproximado: subs activas * pricePerStudent * studentsCount por escuela
  let mrr = 0;
  for (const s of activeSubs) {
    const count = await prisma.student.count({
      where: { schoolId: s.schoolId, active: true },
    });
    mrr += count * s.pricePerStudent;
  }

  const stats = [
    { label: 'Colegios totales', value: totalSchools },
    { label: 'Activos', value: activeSchools },
    { label: 'Suspendidos', value: pausedSchools },
    { label: 'Alumnos totales', value: totalStudents },
    { label: 'Subs activas', value: activeSubs.length },
    { label: 'En trial', value: trialingSubs },
    { label: 'Past due', value: pastDueSubs },
    { label: 'Viajes ahora', value: activeTrips },
    { label: 'Viajes últimos 7d', value: last7Trips },
    { label: 'MRR estimado (USD)', value: `$${mrr.toFixed(0)}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Super-admin · Dashboard global</h1>
        <p className="text-sm text-muted-foreground">Métricas agregadas de toda la plataforma.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase font-bold text-muted-foreground">{s.label}</p>
              <p className="text-3xl font-black">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Notas</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>· MRR estimado = sum(students_activos × price_per_student) por sub activa.</p>
          <p>· Stats consultan filas vivas — sin caché. Para uso en escala se denormaliza.</p>
        </CardContent>
      </Card>
    </div>
  );
}
