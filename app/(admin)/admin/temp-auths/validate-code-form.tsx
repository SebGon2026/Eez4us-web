'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { documentTypeLabel } from '@/lib/documents';

interface ValidationResult {
  id: string;
  personName: string;
  documentType: string | null;
  documentId: string | null;
  vehicleInfo: string | null;
  validDate: string;
  parent: { id: string; name: string | null; email: string };
  students: { id: string; firstName: string; lastName: string; grade?: { name: string } | null }[];
}

export function ValidateCodeForm() {
  const router = useRouter();
  const t = useTranslations('comms');
  const locale = useLocale();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function onValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setPending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/temporary-authorizations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setResult(data.authorization);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('validate.validateError'));
    } finally {
      setPending(false);
    }
  }

  async function onConfirm() {
    if (!result) return;
    if (!confirm(t('validate.confirmPrompt', { name: result.personName }))) return;
    setConfirming(true);
    try {
      const res = await fetch(
        `/api/admin/temporary-authorizations/${result.id}/confirm`,
        { method: 'POST', credentials: 'include' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(t('validate.confirmed'));
      setResult(null);
      setCode('');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('validate.confirmError'));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('validate.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onValidate} className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="font-mono uppercase tracking-widest"
            maxLength={20}
            required
          />
          <Button type="submit" disabled={pending}>
            {pending ? t('validate.validating') : t('validate.action')}
          </Button>
        </form>

        {result && (
          <div className="rounded-2xl border-2 border-green-200 bg-green-50/40 p-4 space-y-3">
            <div>
              <p className="text-xs uppercase font-bold text-muted-foreground">
                {t('validate.tempPerson')}
              </p>
              <p className="text-xl font-black">{result.personName}</p>
              {result.documentId && (
                <p className="text-sm">
                  {t('validate.document', {
                    type:
                      documentTypeLabel(result.documentType, locale === 'en' ? 'en' : 'es') ??
                      t('validate.docFallback'),
                    id: result.documentId,
                  })}
                </p>
              )}
              {result.vehicleInfo && (
                <p className="text-sm">
                  {t('tempAuths.vehicleLine', { info: result.vehicleInfo })}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-muted-foreground">
                {t('validate.authorizingParent')}
              </p>
              <p>{result.parent.name ?? result.parent.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-muted-foreground">
                {t('validate.authorizedChildren')}
              </p>
              <ul className="text-sm">
                {result.students.map((s) => (
                  <li key={s.id}>
                    • {s.firstName} {s.lastName}
                    {s.grade ? ` (${s.grade.name})` : ''}
                  </li>
                ))}
              </ul>
            </div>
            <p className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-900">
              {t('validate.recommendation')}
            </p>
            <Button onClick={onConfirm} disabled={confirming} className="w-full" size="lg">
              {confirming ? t('validate.confirming') : t('validate.confirmDelivery')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
