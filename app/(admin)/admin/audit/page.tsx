import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { intlLocaleOf } from '@/lib/locale';
import { getCurrentSession } from '@/lib/session';

export default async function AuditPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/admin');

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { actor: { select: { name: true, email: true, role: true } } },
  });

  const t = await getTranslations('schools');
  const dateLocale = intlLocaleOf(await getLocale());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">{t('audit.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('audit.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('audit.events')}</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('audit.empty')}</p>
          ) : (
            <ul className="divide-y text-sm">
              {logs.map((log) => (
                <li key={log.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">
                        {log.action} · {log.entity}
                        {log.entityId ? (
                          <span className="text-xs text-muted-foreground"> #{log.entityId}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.actor?.name ?? log.actor?.email ?? t('audit.system')}{' '}
                        ({log.actor?.role ?? 'n/a'})
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString(dateLocale)}
                    </span>
                  </div>
                  {log.metadata != null && (
                    <pre className="mt-1 text-[10px] text-muted-foreground bg-secondary/50 rounded p-2 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
