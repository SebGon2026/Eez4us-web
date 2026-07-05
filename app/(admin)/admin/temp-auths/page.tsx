import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { intlLocaleOf } from '@/lib/locale';
import { getCurrentSession } from '@/lib/session';

import { ValidateCodeForm } from './validate-code-form';

export default async function TempAuthsPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'support_staff', 'super_admin'].includes(session.user.role)) {
    redirect('/admin');
  }
  const t = await getTranslations('comms');
  const intlLocale = intlLocaleOf(await getLocale());

  const history = await prisma.temporaryAuthorization.findMany({
    where: { schoolId: session.user.schoolId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      parent: { select: { name: true, email: true } },
      usedByStaff: { select: { name: true } },
    },
  });

  const allStudentIds = [...new Set(history.flatMap((h) => h.studentIds))];
  const students = allStudentIds.length
    ? await prisma.student.findMany({
        where: { id: { in: allStudentIds }, schoolId: session.user.schoolId },
        select: { id: true, firstName: true, lastName: true, grade: { select: { name: true } } },
      })
    : [];
  const studentById = new Map(students.map((s) => [s.id, s]));

  const todayStr = new Date().toDateString();
  const activeToday = history.filter(
    (h) =>
      !h.usedAt &&
      !h.revokedAt &&
      new Date(h.validDate).toDateString() === todayStr,
  );

  function studentNames(ids: string[]) {
    return ids
      .map((id) => studentById.get(id))
      .filter(Boolean)
      .map((s) => `${s!.firstName} ${s!.lastName}${s!.grade ? ` (${s!.grade.name})` : ''}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">{t('tempAuths.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tempAuths.subtitle')}</p>
      </div>

      <ValidateCodeForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {t('tempAuths.activeToday', { count: activeToday.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeToday.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('tempAuths.activeTodayEmpty')}</p>
          ) : (
            <ul className="space-y-3">
              {activeToday.map((h) => (
                <li
                  key={h.id}
                  className="rounded-2xl border-2 border-yellow-200 bg-yellow-50/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-black text-lg">{h.personName}</p>
                      <p className="text-sm">
                        {t('tempAuths.authorizes')}{' '}
                        <span className="font-bold">{h.parent.name ?? h.parent.email}</span>
                      </p>
                      {h.vehicleInfo && (
                        <p className="text-sm">
                          {t('tempAuths.vehicleLine', { info: h.vehicleInfo })}
                        </p>
                      )}
                      <p className="text-sm">
                        {t('tempAuths.picksUp')}{' '}
                        <span className="font-bold">
                          {studentNames(h.studentIds).join(', ') || '—'}
                        </span>
                      </p>
                    </div>
                    <code className="rounded-xl bg-secondary px-3 py-2 font-mono text-lg font-black tracking-widest">
                      {h.code}
                    </code>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {t('tempAuths.historyTitle', { count: history.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('tempAuths.historyEmpty')}</p>
          ) : (
            <ul className="divide-y text-sm">
              {history.map((h) => (
                <li key={h.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{h.personName}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.rich('tempAuths.historyMeta', {
                          name: h.parent.name ?? h.parent.email,
                          code: h.code,
                          date: new Date(h.validDate).toLocaleDateString(intlLocale),
                          c: (chunks) => (
                            <code className="rounded bg-secondary px-1 py-0.5">{chunks}</code>
                          ),
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('tempAuths.picksUp')} {studentNames(h.studentIds).join(', ') || '—'}
                        {h.vehicleInfo
                          ? ` · ${t('tempAuths.vehicleLine', { info: h.vehicleInfo })}`
                          : ''}
                      </p>
                    </div>
                    <div>
                      {h.revokedAt ? (
                        <span className="rounded-full bg-destructive/20 px-2 py-1 text-xs font-bold text-destructive">
                          {t('tempAuths.status.revoked')}
                        </span>
                      ) : h.usedAt ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
                          {t('tempAuths.status.usedBy', { name: h.usedByStaff?.name ?? 'staff' })}
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-800">
                          {t('tempAuths.status.pending')}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
