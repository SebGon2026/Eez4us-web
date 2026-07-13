'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Control del owner para extender/ajustar el trial y la gracia por impago de un colegio
// (PUT /trial, con AuditLog).
export function TrialEditor({
  schoolId,
  gracePeriodDays = 7,
}: {
  schoolId: string;
  gracePeriodDays?: number;
}) {
  const t = useTranslations('billing');
  const router = useRouter();
  const [days, setDays] = useState('15');
  const [date, setDate] = useState('');
  const [grace, setGrace] = useState(String(gracePeriodDays));
  const [pending, setPending] = useState(false);

  async function submit(body: { extendDays?: number; trialEndsAt?: string; gracePeriodDays?: number }) {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/schools/${schoolId}/trial`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? `HTTP ${res.status}`);
        return;
      }
      toast.success(body.gracePeriodDays != null ? t('trial.graceUpdated') : t('trial.updated'));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border bg-secondary/40 p-4">
      <p className="text-xs font-bold uppercase text-muted-foreground">{t('trial.adjust')}</p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs">{t('trial.extendDays')}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-24"
            />
            <Button
              type="button"
              size="sm"
              disabled={pending || !Number(days)}
              onClick={() => submit({ extendDays: Number(days) })}
            >
              {t('trial.extend')}
            </Button>
          </div>
        </div>
        <div>
          <Label className="text-xs">{t('trial.orSetExactDate')}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || !date}
              onClick={() => submit({ trialEndsAt: new Date(`${date}T23:59:59`).toISOString() })}
            >
              {t('trial.set')}
            </Button>
          </div>
        </div>
        <div>
          <Label className="text-xs">{t('trial.gracePeriod')}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={60}
              value={grace}
              onChange={(e) => setGrace(e.target.value)}
              className="w-24"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || grace === '' || Number.isNaN(Number(grace))}
              onClick={() => submit({ gracePeriodDays: Number(grace) })}
            >
              {t('trial.saveGrace')}
            </Button>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t('trial.gracePeriodHint')}</p>
    </div>
  );
}
