'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function NewSchoolForm() {
  const t = useTranslations('schools');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [name, setName] = useState('');
  const [internalCode, setInternalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [trialDays, setTrialDays] = useState('14');
  const [directorName, setDirectorName] = useState('');
  const [directorEmail, setDirectorEmail] = useState('');
  const [directorPassword, setDirectorPassword] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          internalCode,
          city: city || undefined,
          country: country || undefined,
          trialDays: trialDays ? Number(trialDays) : undefined,
          director: { name: directorName, email: directorEmail, password: directorPassword },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? `HTTP ${res.status}`);
        return;
      }
      toast.success(t('new.created'));
      router.push(`/admin/schools/${data.school.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>{t('new.nameLabel')}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label>{t('new.internalCodeLabel')}</Label>
        <Input
          value={internalCode}
          onChange={(e) => setInternalCode(e.target.value.toUpperCase())}
          placeholder={t('new.internalCodePlaceholder')}
          required
          className="font-mono uppercase"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t('new.city')}</Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t('new.cityPlaceholder')}
          />
        </div>
        <div>
          <Label>{t('new.country')}</Label>
          <Input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder={t('new.countryPlaceholder')}
          />
        </div>
      </div>
      <div>
        <Label>{t('new.trialDaysLabel')}</Label>
        <Input
          type="number"
          min={1}
          max={365}
          value={trialDays}
          onChange={(e) => setTrialDays(e.target.value)}
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">{t('new.trialDaysHint')}</p>
      </div>
      <hr className="my-4" />
      <p className="text-sm font-bold uppercase text-muted-foreground">
        {t('new.initialDirector')}
      </p>
      <div>
        <Label>{tCommon('fields.name')}</Label>
        <Input value={directorName} onChange={(e) => setDirectorName(e.target.value)} required />
      </div>
      <div>
        <Label>{tCommon('fields.email')}</Label>
        <Input
          type="email"
          value={directorEmail}
          onChange={(e) => setDirectorEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label>{t('new.initialPassword')}</Label>
        <Input
          type="text"
          value={directorPassword}
          onChange={(e) => setDirectorPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? t('creating') : t('new.createSchool')}
      </Button>
    </form>
  );
}
