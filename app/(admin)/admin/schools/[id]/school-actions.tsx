'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

export function SchoolActions({ schoolId, active }: { schoolId: string; active: boolean }) {
  const t = useTranslations('schools');
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggleActive() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/schools/${schoolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(active ? t('actions.suspended') : t('actions.reactivated'));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex gap-2">
      <form action={`/api/admin/schools/${schoolId}/impersonate`} method="POST">
        <Button type="submit" variant="outline">
          {t('viewAsDirector')}
        </Button>
      </form>
      <Button onClick={toggleActive} disabled={pending} variant={active ? 'destructive' : 'default'}>
        {pending ? '…' : active ? t('actions.suspend') : t('actions.reactivate')}
      </Button>
    </div>
  );
}
