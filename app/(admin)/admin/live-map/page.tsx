import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

import { LiveMap } from './live-map';

export default async function LiveMapPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'support_staff', 'super_admin'].includes(session.user.role)) redirect('/admin');

  const [school, pickupPoints] = await Promise.all([
    prisma.school.findUnique({
      where: { id: session.user.schoolId },
      select: { name: true, addressLat: true, addressLng: true },
    }),
    prisma.pickupPoint.findMany({
      where: { schoolId: session.user.schoolId, active: true },
      select: {
        id: true,
        name: true,
        centerLat: true,
        centerLng: true,
        radiusMeters: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Mapa en vivo</h1>
        <p className="text-sm text-muted-foreground">
          Posiciones en tiempo real de los padres en camino al colegio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{school?.name ?? 'Colegio'}</CardTitle>
        </CardHeader>
        <CardContent>
          <LiveMap
            center={
              school?.addressLat != null && school?.addressLng != null
                ? { lat: school.addressLat, lng: school.addressLng }
                : { lat: -34.603722, lng: -58.381592 }
            }
            pickupPoints={pickupPoints}
          />
        </CardContent>
      </Card>
    </div>
  );
}
