import { redirect } from 'next/navigation';

import { GradesManager } from '@/components/admin/grades-manager';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function GradesPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
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
        <h1 className="text-3xl font-black">Grados</h1>
        <p className="text-sm text-muted-foreground">
          Agrupá a los alumnos. El nombre es libre — &quot;Primero A&quot;, &quot;Kínder&quot;, etc.
        </p>
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
