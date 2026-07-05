import { Tag } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { StudentForm } from '@/components/admin/student-form';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function NewStudentPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  const t = await getTranslations('students');
  const schoolId = session.user.schoolId;

  const grades = await prisma.grade.findMany({
    where: { schoolId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('new.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('new.subtitle')}</p>
      </div>

      {grades.length === 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Tag className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-900">{t('new.noGradesWarning')}</p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/admin/grades">{t('new.configureGrades')}</Link>
          </Button>
        </div>
      )}

      <StudentForm
        schoolId={schoolId}
        grades={grades}
        initial={{
          firstName: '',
          lastName: '',
          gradeId: null,
          externalId: null,
          birthDate: null,
          pickupMode: 'PRIVATE_VEHICLE',
          transportName: null,
          transportPlate: null,
          transportPhone: null,
          transportVehicleType: null,
        }}
      />
    </div>
  );
}
