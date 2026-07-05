import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { SupportBoard } from '@/components/admin/support-board';
import { getCurrentSession } from '@/lib/session';

export default async function SupportPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  const t = await getTranslations('comms');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('support.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('support.subtitle')}</p>
      </div>
      <SupportBoard scope="mine" canAdmin={false} />
    </div>
  );
}
