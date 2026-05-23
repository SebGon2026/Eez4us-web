import Link from 'next/link';
import { redirect } from 'next/navigation';

import { DeleteButton } from '@/components/admin/delete-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function PickupPointsPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  const schoolId = session.user.schoolId;

  const pickupPoints = await prisma.pickupPoint.findMany({
    where: { schoolId, active: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      centerLat: true,
      centerLng: true,
      radiusMeters: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Puntos de recogida</h1>
          <p className="text-sm text-muted-foreground">
            Cada punto tiene su propio geofence circular.
          </p>
        </div>
        <Link href="/admin/pickup-points/new">
          <Button>Nuevo punto</Button>
        </Link>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Coordenadas</TableHead>
              <TableHead>Radio</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pickupPoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  Aún no hay puntos.
                </TableCell>
              </TableRow>
            ) : (
              pickupPoints.map((pp) => (
                <TableRow key={pp.id}>
                  <TableCell className="font-bold">{pp.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {pp.centerLat.toFixed(5)}, {pp.centerLng.toFixed(5)}
                  </TableCell>
                  <TableCell>{pp.radiusMeters} m</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Link href={`/admin/pickup-points/${pp.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <DeleteButton
                        url={`/api/schools/${schoolId}/pickup-points/${pp.id}`}
                        description="Se desactiva el punto. No se eliminan viajes históricos."
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
