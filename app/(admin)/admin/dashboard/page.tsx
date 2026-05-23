import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export const runtime = 'edge';

export default async function DashboardHomePage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  const schoolId = session.user.schoolId;

  const [pickupPoints, counts] = await Promise.all([
    prisma.pickupPoint.findMany({
      where: { schoolId, active: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, centerLat: true, centerLng: true, radiusMeters: true },
    }),
    prisma.trip.groupBy({
      by: ['pickupPointId'],
      where: { schoolId, status: { in: ['EN_CAMINO', 'EN_ZONA'] } },
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map(counts.map((c) => [c.pickupPointId, c._count._all]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Dashboard en vivo</h1>
        <p className="text-sm text-muted-foreground">
          Elegí un punto de recogida para ver los viajes activos rankeados por ETA.
        </p>
      </div>

      {pickupPoints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No hay puntos de recogida activos. Configurá uno en{' '}
            <Link href="/admin/pickup-points" className="font-bold text-primary underline">
              Puntos de recogida
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pickupPoints.map((pp) => {
            const active = countMap.get(pp.id) ?? 0;
            return (
              <Link key={pp.id} href={`/admin/dashboard/pickup/${pp.id}`}>
                <Card className="h-full shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <CardHeader>
                    <CardDescription className="font-bold uppercase tracking-wide">
                      {pp.name}
                    </CardDescription>
                    <CardTitle className="text-5xl text-primary">{active}</CardTitle>
                    <p className="pt-1 text-xs text-muted-foreground">
                      {active === 1 ? 'viaje activo' : 'viajes activos'}
                    </p>
                  </CardHeader>
                  <CardContent className="pb-6 text-xs text-muted-foreground">
                    Radio {pp.radiusMeters} m · {pp.centerLat.toFixed(4)},{' '}
                    {pp.centerLng.toFixed(4)}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
