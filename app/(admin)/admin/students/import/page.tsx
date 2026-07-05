import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { StudentImportDropzone } from '@/components/admin/student-import-dropzone';
import { getCurrentSession } from '@/lib/session';

export default async function ImportStudentsPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');
  const t = await getTranslations('students');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('import.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('import.subtitle')}</p>
      </div>
      <StudentImportDropzone schoolId={session.user.schoolId} />
    </div>
  );
}
