import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { GradesManager } from '@/components/admin/grades-manager';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function GradesPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  const t = await getTranslations('students');
  const schoolId = session.user.schoolId;

  const grades = await prisma.grade.findMany({
    where: { schoolId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      _count: { select: { students: { where: { active: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('grades.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('grades.subtitle')}</p>
      </div>

      <GradesManager
        schoolId={schoolId}
        grades={grades.map((g) => ({
          id: g.id,
          name: g.name,
          studentCount: g._count.students,
        }))}
      />
    </div>
  );
}
