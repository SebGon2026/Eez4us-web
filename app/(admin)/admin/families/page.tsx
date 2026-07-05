import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function FamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'support_staff', 'super_admin'].includes(session.user.role)) redirect('/admin');

  const t = await getTranslations('students');
  const tCommon = await getTranslations('common');
  const canInvite = ['director', 'super_admin'].includes(session.user.role);
  const { q } = await searchParams;
  const search = (q ?? '').trim();

  const parents = await prisma.user.findMany({
    where: {
      schoolId: session.user.schoolId,
      role: 'parent',
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phoneE164: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phoneE164: true,
      _count: {
        select: {
          parentStudents: true,
          vehicles: true,
          authorizedFamilies: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">{t('families.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('families.subtitle')}</p>
        </div>
        {canInvite && (
          <Link href="/admin/families/new">
            <Button>{t('families.new.title')}</Button>
          </Link>
        )}
      </div>

      <form className="flex gap-2" action="" method="get">
        <input
          name="q"
          defaultValue={search}
          placeholder={t('families.searchPlaceholder')}
          className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-2xl border-2 border-input px-4 text-sm font-bold hover:bg-secondary"
        >
          {tCommon('actions.search')}
        </button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {t('families.parentsCount', { count: parents.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {parents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {search ? t('families.emptyFiltered') : t('families.empty')}
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {parents.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{p.name ?? p.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.email}
                        {p.phoneE164 ? ` · ${p.phoneE164}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{t('families.childrenCount', { count: p._count.parentStudents })}</span>
                      <span>{t('families.vehiclesCount', { count: p._count.vehicles })}</span>
                      <span>
                        {t('families.familyMembersCount', { count: p._count.authorizedFamilies })}
                      </span>
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
