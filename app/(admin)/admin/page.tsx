import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AdminHomeTiles } from '@/components/admin/admin-home-tiles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function AdminHomePage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  const schoolId = session.user.schoolId;

  const pickupCount = await prisma.pickupPoint.count({
    where: { schoolId, active: true },
  });
  if (pickupCount === 0) redirect('/admin/setup');

  const [studentsCount, invitationsPending, tripsActive] = await Promise.all([
    prisma.student.count({ where: { schoolId, active: true } }),
    prisma.invitation.count({
      where: { schoolId, status: { in: ['PENDING', 'SENT'] } },
    }),
    prisma.trip.count({
      where: { schoolId, status: { in: ['EN_CAMINO', 'EN_ZONA'] } },
    }),
  ]);

  const tiles = [
    { label: 'Alumnos activos', value: studentsCount, href: '/admin/students' },
    { label: 'Invitaciones pendientes', value: invitationsPending, href: '/admin/invitations' },
    { label: 'Viajes en curso', value: tripsActive, href: '/admin/dashboard' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Inicio</h1>
        <p className="text-sm text-muted-foreground">Resumen rápido de la escuela.</p>
      </div>

      <AdminHomeTiles tiles={tiles} />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Atajos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/students/import"
            className="rounded-2xl border-2 border-input px-4 py-3 text-sm font-bold transition-colors hover:bg-secondary"
          >
            Importar padres desde Excel
          </Link>
          <Link
            href="/admin/pickup-points/new"
            className="rounded-2xl border-2 border-input px-4 py-3 text-sm font-bold transition-colors hover:bg-secondary"
          >
            Agregar punto de recogida
          </Link>
          <Link
            href="/admin/grades"
            className="rounded-2xl border-2 border-input px-4 py-3 text-sm font-bold transition-colors hover:bg-secondary"
          >
            Gestionar grados
          </Link>
          <Link
            href="/admin/students/new"
            className="rounded-2xl border-2 border-input px-4 py-3 text-sm font-bold transition-colors hover:bg-secondary"
          >
            Agregar alumno
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
