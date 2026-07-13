'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Select } from '@/components/ui/select';

const STATUS_VALUES = ['PENDING', 'SENT', 'CLAIMED', 'EXPIRED', 'REVOKED'] as const;

interface InvitationsFiltersProps {
  grades: Array<{ id: string; name: string }>;
}

export function InvitationsFilters({ grades }: InvitationsFiltersProps) {
  const t = useTranslations('invitations');
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get('status') ?? '';
  const grade = params.get('grade') ?? '';

  function apply(nextStatus: string, nextGrade: string) {
    const sp = new URLSearchParams();
    if (nextStatus) sp.set('status', nextStatus);
    if (nextGrade) sp.set('grade', nextGrade);
    sp.set('page', '1');
    router.push(`/admin/invitations?${sp.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Select
        value={status}
        onChange={(e) => apply(e.target.value, grade)}
        className="sm:max-w-xs"
      >
        <option value="">{t('filters.all')}</option>
        {STATUS_VALUES.map((value) => (
          <option key={value} value={value}>
            {t(`filters.${value}`)}
          </option>
        ))}
      </Select>
      <Select
        value={grade}
        onChange={(e) => apply(status, e.target.value)}
        className="sm:max-w-xs"
      >
        <option value="">{t('filters.allGrades')}</option>
        {grades.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
