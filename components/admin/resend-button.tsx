'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface ResendButtonProps {
  schoolId: string;
  invitationId: string;
}

export function ResendButton({ schoolId, invitationId }: ResendButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onResend() {
    setPending(true);
    try {
      const res = await fetch(
        `/api/schools/${schoolId}/invitations/${invitationId}/resend`,
        { method: 'POST' },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? 'No se pudo reenviar');
        return;
      }
      toast.success('Invitación reenviada');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={onResend} disabled={pending}>
      {pending ? 'Enviando…' : 'Reenviar'}
    </Button>
  );
}
