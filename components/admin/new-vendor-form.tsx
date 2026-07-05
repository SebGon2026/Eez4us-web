'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface User {
  id: string;
  email: string;
  name: string | null;
}

export function NewVendorForm({ candidateUsers }: { candidateUsers: User[] }) {
  const t = useTranslations('schools');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [mode, setMode] = useState<'existing' | 'new'>(
    candidateUsers.length > 0 ? 'existing' : 'new',
  );
  const [userId, setUserId] = useState(candidateUsers[0]?.id ?? '');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [commissionPct, setCommissionPct] = useState('10');
  const [commissionMonths, setCommissionMonths] = useState('3');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const pct = Number(commissionPct) / 100;
      if (Number.isNaN(pct) || pct < 0 || pct > 1) {
        setError(t('vendors.invalidCommission'));
        return;
      }
      // vacío = sin límite de meses
      const months = commissionMonths.trim() === '' ? null : Number(commissionMonths);
      if (months !== null && (!Number.isInteger(months) || months < 1 || months > 60)) {
        setError(t('vendors.invalidDuration'));
        return;
      }
      const body =
        mode === 'existing'
          ? { userId, commissionPct: pct, commissionMonths: months }
          : { email, name, commissionPct: pct, commissionMonths: months };
      try {
        const res = await fetch('/api/vendors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        if (!res.ok) {
          setError(data?.error ?? `HTTP ${res.status}`);
          return;
        }
        router.push('/admin/vendors');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('unknownError'));
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'existing' ? 'default' : 'outline'}
          onClick={() => setMode('existing')}
          disabled={candidateUsers.length === 0}
        >
          {t('vendors.existingUser')}
        </Button>
        <Button
          type="button"
          variant={mode === 'new' ? 'default' : 'outline'}
          onClick={() => setMode('new')}
        >
          {t('vendors.newUser')}
        </Button>
      </div>

      {mode === 'existing' ? (
        <div className="space-y-2">
          <Label htmlFor="userId">{t('vendors.user')}</Label>
          <Select id="userId" value={userId} onChange={(e) => setUserId(e.target.value)} required>
            {candidateUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email} ({u.email})
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{tCommon('fields.name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{tCommon('fields.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="commission">{t('vendors.commissionPct')}</Label>
          <Input
            id="commission"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={commissionPct}
            onChange={(e) => setCommissionPct(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="commissionMonths">{t('vendors.durationMonths')}</Label>
          <Input
            id="commissionMonths"
            type="number"
            min="1"
            max="60"
            step="1"
            value={commissionMonths}
            onChange={(e) => setCommissionMonths(e.target.value)}
            placeholder={t('vendors.emptyNoLimit')}
          />
          <p className="text-xs text-muted-foreground">
            {t('vendors.commissionExample', { months: commissionMonths || 'N' })}
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? t('creating') : t('vendors.create')}
        </Button>
      </div>
    </form>
  );
}
