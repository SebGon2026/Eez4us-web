import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { SchoolReport } from '@/components/admin/school-report';
import { getCurrentSession } from '@/lib/session';

export default async function SchoolReportPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');
  if (!session.user.schoolId) redirect('/admin');
  const t = await getTranslations('reports');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('school.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('school.subtitle')}</p>
      </div>
      <SchoolReport />
    </div>
  );
}
