import { redirect } from 'next/navigation';

import { SchoolReport } from '@/components/admin/school-report';
import { requireSchoolPage } from '@/lib/session';

export default async function SchoolReportPage() {
  const { session } = await requireSchoolPage();
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Reporte de mi escuela</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de entregas por día.
        </p>
      </div>
      <SchoolReport />
    </div>
  );
}
