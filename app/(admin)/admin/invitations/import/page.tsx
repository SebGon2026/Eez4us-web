import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { ExcelDropzone } from '@/components/admin/excel-dropzone';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function ImportParentsPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');
  const t = await getTranslations('invitations');
  const schoolId = session.user.schoolId;

  const [school, students] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId }, select: { country: true } }),
    prisma.student.findMany({
      where: { schoolId, active: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true, firstName: true, lastName: true, externalId: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('importParents.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('importParents.subtitle')}</p>
      </div>
      <ExcelDropzone
        schoolId={schoolId}
        country={school?.country}
        students={students.map((s) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`.trim(),
          externalId: s.externalId,
        }))}
      />
    </div>
  );
}
