import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function InvitationsReportPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');

  const schoolId = session.user.schoolId;

  const [byChannel, byStatus, totals] = await Promise.all([
    prisma.invitation.groupBy({
      by: ['channel'],
      where: { schoolId },
      _count: { _all: true },
    }),
    prisma.invitation.groupBy({
      by: ['status'],
      where: { schoolId },
      _count: { _all: true },
    }),
    prisma.invitation.count({ where: { schoolId } }),
  ]);

  const claimedTotal = byStatus.find((b) => b.status === 'CLAIMED')?._count._all ?? 0;
  const claimedRate = totals ? Math.round((claimedTotal / totals) * 100) : 0;

  const t = await getTranslations('reports');
  const STATUS_KEYS = ['PENDING', 'SENT', 'CLAIMED', 'EXPIRED', 'REVOKED'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('invitations.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('invitations.subtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase font-bold text-muted-foreground">
              {t('invitations.total')}
            </p>
            <p className="text-3xl font-black">{totals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase font-bold text-muted-foreground">
              {t('invitations.claimed')}
            </p>
            <p className="text-3xl font-black text-emerald-600">{claimedTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase font-bold text-muted-foreground">
              {t('invitations.claimedRate')}
            </p>
            <p className="text-3xl font-black">{claimedRate}%</p>
          </CardContent>
        </Card>
        {byChannel.map((b) => (
          <Card key={b.channel}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase font-bold text-muted-foreground">
                {t('invitations.channel', { channel: b.channel })}
              </p>
              <p className="text-3xl font-black">{b._count._all}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('invitations.byStatus')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {byStatus.map((b) => (
              <li
                key={b.status}
                className="flex items-center justify-between rounded-2xl bg-secondary px-3 py-2"
              >
                <span className="font-bold">
                  {STATUS_KEYS.includes(b.status) ? t(`invitations.status.${b.status}`) : b.status}
                </span>
                <span>{b._count._all}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
