import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { SupportBoard } from '@/components/admin/support-board';
import { getCurrentSession } from '@/lib/session';

export default async function SupportAdminPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/admin/support');
  const t = await getTranslations('comms');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('support.adminTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('support.adminSubtitle')}</p>
      </div>
      <SupportBoard scope="all" canAdmin={true} />
    </div>
  );
}
