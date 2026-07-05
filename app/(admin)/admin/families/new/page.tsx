import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { ParentInviteForm } from '@/components/admin/parent-invite-form';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function NewParentPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');
  const t = await getTranslations('students');
  const schoolId = session.user.schoolId;

  const students = await prisma.student.findMany({
    where: { schoolId, active: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      externalId: true,
      grade: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('families.new.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('families.new.subtitle')}</p>
      </div>
      <ParentInviteForm
        schoolId={schoolId}
        students={students.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          externalId: s.externalId,
          gradeName: s.grade?.name ?? null,
        }))}
      />
    </div>
  );
}
