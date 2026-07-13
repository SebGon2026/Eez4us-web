'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface ResendButtonProps {
  schoolId: string;
  invitationId: string;
}

export function ResendButton({ schoolId, invitationId }: ResendButtonProps) {
  const t = useTranslations('invitations');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onResend() {
    setPending(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/invitations/${invitationId}/resend`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? t('resend.failed'));
        return;
      }
      toast.success(t('resend.success'));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('resend.unexpectedError'));
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={onResend} disabled={pending}>
      {pending ? tCommon('actions.sending') : t('resend.action')}
    </Button>
  );
}
