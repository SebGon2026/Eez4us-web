'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

export function SchoolActions({ schoolId, active }: { schoolId: string; active: boolean }) {
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
      toast.success(active ? 'Colegio suspendido' : 'Colegio reactivado');
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
          Ver como director
        </Button>
      </form>
      <Button onClick={toggleActive} disabled={pending} variant={active ? 'destructive' : 'default'}>
        {pending ? '…' : active ? 'Suspender' : 'Reactivar'}
      </Button>
    </div>
  );
}
