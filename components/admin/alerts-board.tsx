'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { intlLocaleOf } from '@/lib/locale';
import { cn } from '@/lib/utils';

type AlertSeverity = 'info' | 'warning' | 'critical';
type AlertType = 'TRIP_OVERDUE' | 'ARRIVED_NOT_DELIVERED' | 'INVITATION_STALE';

export interface AlertItem {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  targetUserId: string | null;
  targetRole: string | null;
}

const SEVERITY_STYLES: Record<AlertSeverity, { border: string; chip: string }> = {
  info: {
    border: 'border-blue-300',
    chip: 'bg-blue-100 text-blue-800',
  },
  warning: {
    border: 'border-amber-300',
    chip: 'bg-amber-100 text-amber-800',
  },
  critical: {
    border: 'border-red-400',
    chip: 'bg-red-100 text-red-800',
  },
};

function formatWhen(iso: string, intlLocale: string): string {
  try {
    return new Date(iso).toLocaleString(intlLocale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function AlertsBoard({ initial }: { initial: AlertItem[] }) {
  const t = useTranslations('comms');
  const intlLocale = intlLocaleOf(useLocale());
  const [alerts, setAlerts] = useState<AlertItem[]>(initial);
  const [filter, setFilter] = useState<'all' | 'unread' | AlertType>('all');
  const [marking, setMarking] = useState<string | null>(null);

  function describeAlert(a: AlertItem): string {
    const p = a.payload;
    if (a.type === 'TRIP_OVERDUE') {
      const parent = (p.parentName as string) ?? t('alerts.describe.parentFallback');
      const students = (p.students as string) ?? '';
      return t('alerts.describe.tripOverdue', { parent, students }).trim();
    }
    if (a.type === 'ARRIVED_NOT_DELIVERED') {
      const parent = (p.parentName as string) ?? t('alerts.describe.parentFallback');
      const students = (p.students as string) ?? '';
      return t('alerts.describe.arrivedNotDelivered', { parent, students }).trim();
    }
    if (a.type === 'INVITATION_STALE') {
      const recipient =
        (p.recipientName as string) ??
        (p.contactValue as string) ??
        t('alerts.describe.parentFallback');
      return t('alerts.describe.invitationStale', { recipient });
    }
    return t('alerts.describe.generic');
  }

  const reload = useCallback(async () => {
    const res = await fetch('/api/alerts?limit=100', { credentials: 'include' });
    if (!res.ok) return;
    const data = (await res.json()) as { alerts?: AlertItem[] };
    if (data.alerts) setAlerts(data.alerts);
  }, []);

  useEffect(() => {
    const id = setInterval(reload, 30_000);
    return () => clearInterval(id);
  }, [reload]);

  const visible = useMemo(() => {
    if (filter === 'all') return alerts;
    if (filter === 'unread') return alerts.filter((a) => !a.readAt);
    return alerts.filter((a) => a.type === filter);
  }, [alerts, filter]);

  async function markAsRead(id: string) {
    setMarking(id);
    try {
      const res = await fetch(`/api/alerts/${id}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, readAt: new Date().toISOString() } : a)),
        );
      }
    } finally {
      setMarking(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            'all',
            'unread',
            'TRIP_OVERDUE',
            'ARRIVED_NOT_DELIVERED',
            'INVITATION_STALE',
          ] as const
        ).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key as typeof filter)}
            className={cn(
              'rounded-2xl border-2 px-4 py-2 text-xs font-bold transition-colors',
              filter === key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-card text-foreground hover:bg-secondary',
            )}
          >
            {t(`alerts.filters.${key}`)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-input bg-card py-16 text-center text-sm text-muted-foreground">
          {t('alerts.empty')}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => {
            const style = SEVERITY_STYLES[a.severity];
            const isUnread = !a.readAt;
            return (
              <article
                key={a.id}
                className={cn(
                  'rounded-3xl border-2 bg-card p-5 shadow-sm transition-opacity',
                  style.border,
                  !isUnread && 'opacity-70',
                )}
              >
                <header className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
                      style.chip,
                    )}
                  >
                    {t(`alerts.severity.${a.severity}`)}
                  </span>
                  <span className="text-sm font-bold">{t(`alerts.type.${a.type}`)}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatWhen(a.createdAt, intlLocale)}
                  </span>
                </header>
                <p className="text-sm">{describeAlert(a)}</p>
                <footer className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {isUnread
                      ? t('alerts.unread')
                      : t('alerts.readAt', {
                          when: a.readAt ? formatWhen(a.readAt, intlLocale) : '',
                        })}
                  </span>
                  {isUnread && (
                    <button
                      type="button"
                      disabled={marking === a.id}
                      onClick={() => markAsRead(a.id)}
                      className="rounded-2xl border-2 border-input px-3 py-1 text-xs font-bold transition-colors hover:bg-secondary disabled:opacity-50"
                    >
                      {marking === a.id ? t('alerts.marking') : t('alerts.markRead')}
                    </button>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
