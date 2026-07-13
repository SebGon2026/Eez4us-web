import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { OperationalReport } from '@/components/admin/operational-report';
import { getCurrentSession } from '@/lib/session';

export default async function OperationalReportPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');
  const t = await getTranslations('reports');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('operational.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('operational.subtitle')}</p>
      </div>
      <OperationalReport isSuper={session.user.role === 'super_admin'} />
    </div>
  );
}
