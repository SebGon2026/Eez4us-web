import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { StaffManager } from '@/components/admin/staff-manager';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function StaffPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');
  const schoolId = session.user.schoolId;

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

  const t = await getTranslations('schools');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('staff.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t.rich('staff.subtitle', {
            b: (chunks) => <span className="font-semibold">{chunks}</span>,
          })}
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
