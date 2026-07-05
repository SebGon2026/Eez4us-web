import { redirect } from 'next/navigation';

import { StaffManager } from '@/components/admin/staff-manager';
import { prisma } from '@/lib/db';
import { requireSchoolPage } from '@/lib/session';

export default async function StaffPage() {
  const { session, schoolId } = await requireSchoolPage();
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');

  const staff = await prisma.user.findMany({
    where: { schoolId, role: { in: ['support_staff', 'logistics'] } },
    orderBy: [{ active: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      _count: { select: { finalizedTrips: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Personal</h1>
        <p className="text-sm text-muted-foreground">
          Cuentas de tu colegio. El <span className="font-semibold">portón</span> usa la app móvil
          para ver llegadas y confirmar entregas; <span className="font-semibold">soporte</span>{' '}
          usa el tablero web.
        </p>
      </div>

      <StaffManager
        schoolId={schoolId}
        currentUserId={session.user.id}
        staff={staff.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          active: s.active,
          createdAt: s.createdAt.toISOString(),
          deliveredCount: s._count.finalizedTrips,
        }))}
      />
    </div>
  );
}
