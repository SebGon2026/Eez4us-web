'use client';

import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { CopyInviteLink } from '@/components/admin/copy-invite-link';
import { type Column, DataTable } from '@/components/admin/data-table';
import { ResendButton } from '@/components/admin/resend-button';
import { EmptyState } from '@/components/empty-state';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type InvitationStatus = 'PENDING' | 'SENT' | 'CLAIMED' | 'EXPIRED' | 'REVOKED';

const STATUS_VARIANTS: Record<InvitationStatus, BadgeProps['variant']> = {
  PENDING: 'warning',
  SENT: 'default',
  CLAIMED: 'success',
  EXPIRED: 'secondary',
  REVOKED: 'destructive',
};

export interface InvitationRow {
  id: string;
  token: string;
  contactValue: string;
  channel: 'EMAIL' | 'WHATSAPP';
  status: InvitationStatus;
  recipientName: string | null;
  studentNames: string[];
  createdAt: string;
  claimedAt: string | null;
  resendable: boolean;
  // PENDING = primer envío posible; SENT/EXPIRED = recordatorio posible.
  selectable: boolean;
}

interface BulkSendResponse {
  targeted: number;
  sentCount: number;
  failedCount: number;
  failures: Array<{ contact: string; reason: string }>;
  remaining: number;
  error?: string;
}

interface InvitationsTableProps {
  rows: InvitationRow[];
  schoolId: string;
  page: number;
  pageSize: number;
  total: number;
  status?: string;
  grade?: string;
  intlLocale: string;
  filtered: boolean;
}

export function InvitationsTable({
  rows,
  schoolId,
  page,
  pageSize,
  total,
  status,
  grade,
  intlLocale,
  filtered,
}: InvitationsTableProps) {
  const t = useTranslations('invitations');
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const selectableRows = rows.filter((r) => r.selectable);
  const allPageSelected =
    selectableRows.length > 0 && selectableRows.every((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) selectableRows.forEach((r) => next.delete(r.id));
      else selectableRows.forEach((r) => next.add(r.id));
      return next;
    });
  }

  async function runBulk(body: {
    mode: 'send' | 'reminder';
    ids?: string[];
    gradeId?: string;
  }) {
    setPending(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/invitations/send-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as BulkSendResponse;
      if (!res.ok) {
        toast.error(data.error ?? t('bulkSend.error'));
        return;
      }
      if (data.targeted === 0) {
        toast.info(t('bulkSend.nothingToSend'));
        return;
      }
      if (data.sentCount > 0) toast.success(t('bulkSend.sentToast', { count: data.sentCount }));
      if (data.failedCount > 0) toast.error(t('bulkSend.failedToast', { count: data.failedCount }));
      if (data.remaining > 0) toast.info(t('bulkSend.remainingToast', { count: data.remaining }));
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('bulkSend.error'));
    } finally {
      setPending(false);
    }
  }

  async function onSendSelected() {
    if (selected.size === 0) return;
    await runBulk({ mode: 'send', ids: [...selected] });
  }

  async function onSendAll() {
    if (!window.confirm(t('bulkSend.confirmSendAll'))) return;
    await runBulk({ mode: 'send', ...(grade ? { gradeId: grade } : {}) });
  }

  async function onRemind() {
    if (selected.size > 0) {
      await runBulk({ mode: 'reminder', ids: [...selected] });
      return;
    }
    if (!window.confirm(t('bulkSend.confirmReminder'))) return;
    await runBulk({ mode: 'reminder', ...(grade ? { gradeId: grade } : {}) });
  }

  const columns: Column<InvitationRow>[] = [
    {
      key: 'contact',
      header: t('list.columns.contact'),
      cell: (r) => (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 accent-primary"
            checked={selected.has(r.id)}
            disabled={!r.selectable}
            onChange={() => toggle(r.id)}
            aria-label={t('bulkSend.selectRow')}
          />
          <div>
            <p className="font-bold">{r.recipientName ?? t('list.noName')}</p>
            <p className="text-xs text-muted-foreground">{r.contactValue}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'channel',
      header: t('list.columns.channel'),
      cell: (r) => (
        <Badge variant={r.channel === 'EMAIL' ? 'default' : 'success'}>{r.channel}</Badge>
      ),
    },
    {
      key: 'students',
      header: t('list.columns.students'),
      cell: (r) => (
        <div className="space-y-0.5 text-xs">
          {r.studentNames.slice(0, 3).map((n) => (
            <p key={n}>{n}</p>
          ))}
          {r.studentNames.length > 3 && (
            <p className="text-muted-foreground">
              {t('list.moreStudents', { count: r.studentNames.length - 3 })}
            </p>
          )}
        </div>
      ),
    },
    {
      // "Envío" habla del ENVÍO; el registro del padre en la app va aparte (columna Registro).
      // Pendiente de envío ≠ enviada ≠ enviada y registrada.
      key: 'status',
      header: t('list.columns.delivery'),
      cell: (r) => <Badge variant={STATUS_VARIANTS[r.status]}>{t(`status.${r.status}`)}</Badge>,
    },
    {
      key: 'registration',
      header: t('list.columns.registration'),
      cell: (r) =>
        r.status === 'CLAIMED' ? (
          <div>
            <Badge variant="success">{t('list.registered')}</Badge>
            {r.claimedAt && (
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {new Date(r.claimedAt).toLocaleDateString(intlLocale)}
              </p>
            )}
          </div>
        ) : r.status === 'REVOKED' ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <Badge variant="warning">{t('list.registrationPending')}</Badge>
        ),
    },
    {
      key: 'date',
      header: t('list.columns.created'),
      cell: (r) => (
        <span className="font-mono text-xs">
          {new Date(r.createdAt).toLocaleDateString(intlLocale)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (r) =>
        r.resendable ? (
          <div className="flex items-center justify-end gap-2">
            <CopyInviteLink token={r.token} />
            <ResendButton schoolId={schoolId} invitationId={r.id} />
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={allPageSelected}
            disabled={selectableRows.length === 0}
            onChange={togglePage}
          />
          {t('bulkSend.selectPage')}
        </label>
        <span className="text-xs text-muted-foreground">
          {t('bulkSend.selectedCount', { count: selected.size })}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" onClick={onSendSelected} disabled={pending || selected.size === 0}>
            {pending ? t('bulkSend.sending') : t('bulkSend.sendSelected')}
          </Button>
          <Button size="sm" variant="outline" onClick={onSendAll} disabled={pending}>
            {grade ? t('bulkSend.sendGradePending') : t('bulkSend.sendAllPending')}
          </Button>
          <Button size="sm" variant="outline" onClick={onRemind} disabled={pending}>
            {t('bulkSend.remindUnregistered')}
          </Button>
        </div>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        page={page}
        pageSize={pageSize}
        total={total}
        baseUrl="/admin/invitations"
        queryParams={{ status, grade }}
        empty={
          filtered ? (
            <EmptyState
              icon={Mail}
              title={t('list.emptyFiltered.title')}
              description={t('list.emptyFiltered.description')}
            />
          ) : (
            <EmptyState
              icon={Mail}
              title={t('list.empty.title')}
              description={t('list.empty.description')}
              action={
                <Link href="/admin/invitations/import">
                  <Button>{t('list.empty.importExcel')}</Button>
                </Link>
              }
            />
          )
        }
      />
    </div>
  );
}
