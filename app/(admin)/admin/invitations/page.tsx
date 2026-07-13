import type { InvitationStatus, Prisma } from '@prisma/client';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { InvitationsFilters } from '@/components/admin/invitations-filters';
import { type InvitationRow, InvitationsTable } from '@/components/admin/invitations-table';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import { intlLocaleOf } from '@/lib/locale';
import { getCurrentSession } from '@/lib/session';

const PAGE_SIZE = 25;

const VALID_STATUSES: InvitationStatus[] = ['PENDING', 'SENT', 'CLAIMED', 'EXPIRED', 'REVOKED'];

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; grade?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  const t = await getTranslations('invitations');
  const intlLocale = intlLocaleOf(await getLocale());
  const schoolId = session.user.schoolId;
  const { page: pageParam, status, grade } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? '1') || 1);
  const statusFilter = VALID_STATUSES.includes(status as InvitationStatus)
    ? (status as InvitationStatus)
    : undefined;

  const grades = await prisma.grade.findMany({
    where: { schoolId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true },
  });
  const gradeFilter = grades.some((g) => g.id === grade) ? grade : undefined;

  // El grado de una invitación se deriva de sus alumnos: matchea si ata al menos un alumno
  // del grado elegido.
  let gradeStudentIds: string[] | null = null;
  if (gradeFilter) {
    const gradeStudents = await prisma.student.findMany({
      where: { schoolId, gradeId: gradeFilter },
      select: { id: true },
    });
    gradeStudentIds = gradeStudents.map((s) => s.id);
  }

  const where: Prisma.InvitationWhereInput = {
    schoolId,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(gradeStudentIds ? { studentIds: { hasSome: gradeStudentIds } } : {}),
  };

  const [total, invitations, byStatus] = await Promise.all([
    prisma.invitation.count({ where }),
    prisma.invitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        token: true,
        contactValue: true,
        channel: true,
        status: true,
        recipientName: true,
        studentIds: true,
        createdAt: true,
        claimedAt: true,
      },
    }),
    prisma.invitation.groupBy({
      by: ['status'],
      where: { schoolId },
      _count: { _all: true },
    }),
  ]);

  const countOf = (s: InvitationStatus) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
  const registered = countOf('CLAIMED');
  // Enviadas (o vencidas) cuyo padre todavía no confirmó su registro en la app
  const awaitingRegistration = countOf('SENT') + countOf('EXPIRED');
  const pendingSend = countOf('PENDING');

  const studentIds = [...new Set(invitations.flatMap((i) => i.studentIds))];
  const students = studentIds.length
    ? await prisma.student.findMany({
        where: { id: { in: studentIds }, schoolId },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const studentMap = new Map(students.map((s) => [s.id, `${s.firstName} ${s.lastName}`]));

  const rows: InvitationRow[] = invitations.map((i) => ({
    id: i.id,
    token: i.token,
    contactValue: i.contactValue,
    channel: i.channel,
    status: i.status,
    recipientName: i.recipientName,
    studentNames: i.studentIds.map((sid) => studentMap.get(sid) ?? sid),
    createdAt: i.createdAt.toISOString(),
    claimedAt: i.claimedAt?.toISOString() ?? null,
    resendable: i.status !== 'CLAIMED' && i.status !== 'REVOKED',
    selectable: i.status === 'PENDING' || i.status === 'SENT' || i.status === 'EXPIRED',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">{t('list.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('list.totalCount', { count: total })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/imports/combined">
            <Button variant="outline">{t('list.importCombined')}</Button>
          </Link>
          <Link href="/admin/invitations/import">
            <Button>{t('importParents.title')}</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-muted-foreground">
            {t('list.cards.registered')}
          </p>
          <p className="text-3xl font-black text-emerald-600">{registered}</p>
        </div>
        <Link
          href="/admin/invitations?status=SENT"
          className="rounded-2xl border bg-card p-4 shadow-sm transition hover:border-primary"
        >
          <p className="text-xs font-bold uppercase text-muted-foreground">
            {t('list.cards.awaitingRegistration')}
          </p>
          <p className="text-3xl font-black text-amber-600">{awaitingRegistration}</p>
          <p className="text-xs text-muted-foreground">{t('list.cards.awaitingHint')}</p>
        </Link>
        <Link
          href="/admin/invitations?status=PENDING"
          className="rounded-2xl border bg-card p-4 shadow-sm transition hover:border-primary"
        >
          <p className="text-xs font-bold uppercase text-muted-foreground">
            {t('list.cards.pendingSend')}
          </p>
          <p className="text-3xl font-black">{pendingSend}</p>
        </Link>
      </div>

      <InvitationsFilters grades={grades} />
      <InvitationsTable
        rows={rows}
        schoolId={schoolId}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        status={statusFilter}
        grade={gradeFilter}
        intlLocale={intlLocale}
        filtered={Boolean(statusFilter || gradeFilter)}
      />
    </div>
  );
}
