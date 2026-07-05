'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

import { Select } from '@/components/ui/select';

const STATUS_VALUES = ['PENDING', 'SENT', 'CLAIMED', 'EXPIRED', 'REVOKED'] as const;

export function InvitationsFilters() {
  const t = useTranslations('invitations');
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get('status') ?? '';

  function apply(next: string) {
    const sp = new URLSearchParams();
    if (next) sp.set('status', next);
    sp.set('page', '1');
    router.push(`/admin/invitations?${sp.toString()}`);
  }

  return (
    <Select value={status} onChange={(e) => apply(e.target.value)} className="sm:max-w-xs">
      <option value="">{t('filters.all')}</option>
      {STATUS_VALUES.map((value) => (
        <option key={value} value={value}>
          {t(`filters.${value}`)}
        </option>
      ))}
    </Select>
  );
}
