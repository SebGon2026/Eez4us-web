import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { type AlertItem,AlertsBoard } from '@/components/admin/alerts-board';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

const STAFF_ROLES = new Set(['director', 'support_staff', 'super_admin']);

export default async function AlertsPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!STAFF_ROLES.has(session.user.role)) redirect('/login');
  const t = await getTranslations('comms');

  const alerts = await prisma.alert.findMany({
    where: {
      schoolId: session.user.schoolId,
      OR: [
        { targetUserId: session.user.id },
        { targetUserId: null, targetRole: session.user.role },
        { targetUserId: null, targetRole: null },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      type: true,
      severity: true,
      payload: true,
      readAt: true,
      createdAt: true,
      targetUserId: true,
      targetRole: true,
    },
  });

  const initial: AlertItem[] = alerts.map((a) => ({
    id: a.id,
    type: a.type as AlertItem['type'],
    severity: a.severity as AlertItem['severity'],
    payload: a.payload as Record<string, unknown>,
    readAt: a.readAt ? a.readAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    targetUserId: a.targetUserId,
    targetRole: a.targetRole,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">{t('alerts.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('alerts.subtitle')}</p>
      </div>
      <AlertsBoard initial={initial} />
    </div>
  );
}
