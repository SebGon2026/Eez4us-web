'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FinalizeButtonProps {
  tripId: string;
  parentName: string;
  studentNames: string[];
  onRemove: () => void;
}

export function FinalizeButton({
  tripId,
  parentName,
  studentNames,
  onRemove,
}: FinalizeButtonProps) {
  const t = useTranslations('dashboard.finalize');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const studentsLabel = studentNames.length > 0 ? studentNames.join(', ') : t('studentFallback');

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/finalize`, { method: 'POST' });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error ?? `HTTP ${res.status}`);
          return;
        }
        setOpen(false);
        onRemove();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('unknownError'));
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} disabled={isPending}>
        {t('button')}
      </Button>
      <Dialog open={open} onOpenChange={(o) => !isPending && setOpen(o)}>
        <DialogHeader>
          <DialogTitle>{t('confirmTitle')}</DialogTitle>
          <DialogDescription>
            {t.rich('confirmBody', {
              students: studentsLabel,
              parent: parentName,
              b: (chunks) => <span className="font-bold text-foreground">{chunks}</span>,
            })}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {tc('actions.cancel')}
          </Button>
          <Button onClick={confirm} disabled={isPending}>
            {isPending ? t('finalizing') : t('yesConfirm')}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
