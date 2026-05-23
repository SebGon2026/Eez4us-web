'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

interface ResendButtonProps {
  schoolId: string;
  invitationId: string;
}

export function ResendButton({ schoolId, invitationId }: ResendButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onResend() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/schools/${schoolId}/invitations/${invitationId}/resend`,
        { method: 'POST' },
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'No se pudo reenviar');
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={onResend} disabled={pending}>
        {pending ? 'Enviando…' : 'Reenviar'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
