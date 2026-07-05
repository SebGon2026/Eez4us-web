'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { intlLocaleOf } from '@/lib/locale';

type TicketType = 'BUG' | 'IMPROVEMENT' | 'SUPPORT';
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface Ticket {
  id: string;
  type: TicketType;
  title: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  reportedBy: { id: string; name: string | null; email: string };
  school?: { id: string; name: string } | null;
}

const TYPE_VARIANT: Record<TicketType, 'default' | 'destructive' | 'warning' | 'secondary'> = {
  BUG: 'destructive',
  IMPROVEMENT: 'warning',
  SUPPORT: 'secondary',
};

const STATUS_VARIANT: Record<TicketStatus, 'default' | 'success' | 'warning' | 'secondary'> = {
  OPEN: 'default',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'secondary',
};

const TICKET_STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

interface SupportBoardProps {
  scope: 'mine' | 'all';
  canAdmin: boolean;
}

export function SupportBoard({ scope, canAdmin }: SupportBoardProps) {
  const t = useTranslations('comms');
  const tc = useTranslations('common');
  const intlLocale = intlLocaleOf(useLocale());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openCreate, setOpenCreate] = useState(false);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ scope });
    if (statusFilter) qs.set('status', statusFilter);
    fetch(`/api/support-tickets?${qs.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ tickets: Ticket[] }>;
      })
      .then((d) => setTickets(d.tickets))
      .catch((err) => setError(err instanceof Error ? err.message : t('support.errorFallback')));
  }, [scope, statusFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: TicketStatus) {
    try {
      const res = await fetch(`/api/support-tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('support.errorFallback'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {canAdmin && (
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-44"
            >
              <option value="">{t('support.statusFilter.all')}</option>
              {TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`support.statusFilter.${status}`)}
                </option>
              ))}
            </Select>
          )}
        </div>
        <Button onClick={() => setOpenCreate(true)}>{t('support.report')}</Button>
      </div>

      {error && (
        <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive">
          {error}
        </p>
      )}

      <Card className="shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('support.table.type')}</TableHead>
              <TableHead>{t('support.table.title')}</TableHead>
              {canAdmin && <TableHead>{t('support.table.reportedBy')}</TableHead>}
              <TableHead>{tc('fields.status')}</TableHead>
              <TableHead>{tc('fields.date')}</TableHead>
              {canAdmin && <TableHead className="text-right">{t('support.table.change')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canAdmin ? 6 : 4}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {t('support.emptyTable')}
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => {
                return (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Badge variant={TYPE_VARIANT[ticket.type]}>
                        {t(`support.ticketType.${ticket.type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">{ticket.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </div>
                    </TableCell>
                    {canAdmin && (
                      <TableCell className="text-xs">
                        <div className="font-bold">{ticket.reportedBy.name ?? '—'}</div>
                        <div className="text-muted-foreground">{ticket.reportedBy.email}</div>
                        {ticket.school && (
                          <div className="text-muted-foreground">{ticket.school.name}</div>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[ticket.status]}>
                        {t(`support.status.${ticket.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString(intlLocale)}
                    </TableCell>
                    {canAdmin && (
                      <TableCell className="text-right">
                        <Select
                          value={ticket.status}
                          onChange={(e) =>
                            updateStatus(ticket.id, e.target.value as TicketStatus)
                          }
                          className="h-9 w-36"
                        >
                          {TICKET_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {t(`support.status.${status}`)}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <CreateTicketDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={() => {
          setOpenCreate(false);
          load();
        }}
      />
    </div>
  );
}

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

function CreateTicketDialog({ open, onOpenChange, onCreated }: CreateDialogProps) {
  const t = useTranslations('comms');
  const tc = useTranslations('common');
  const [type, setType] = useState<TicketType>('BUG');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, description }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      setTitle('');
      setDescription('');
      setType('BUG');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('support.errorFallback'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{t('support.dialog.title')}</DialogTitle>
        <DialogDescription>{t('support.dialog.description')}</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="t-type">{t('support.dialog.typeLabel')}</Label>
          <Select
            id="t-type"
            value={type}
            onChange={(e) => setType(e.target.value as TicketType)}
          >
            <option value="BUG">{t('support.ticketType.BUG')}</option>
            <option value="IMPROVEMENT">{t('support.ticketType.IMPROVEMENT')}</option>
            <option value="SUPPORT">{t('support.ticketType.SUPPORT')}</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-title">{t('support.dialog.titleLabel')}</Label>
          <Input
            id="t-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            maxLength={140}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-desc">{t('support.dialog.descriptionLabel')}</Label>
          <Textarea
            id="t-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            required
            minLength={3}
            maxLength={4000}
          />
        </div>
        {error && (
          <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {tc('actions.cancel')}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? tc('actions.sending') : tc('actions.send')}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
