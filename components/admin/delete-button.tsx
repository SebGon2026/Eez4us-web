'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DeleteButtonProps {
  url: string;
  label?: string;
  title?: string;
  description?: string;
  successMessage?: string;
  size?: 'default' | 'sm';
}

export function DeleteButton({
  url,
  label,
  title,
  description,
  successMessage,
  size = 'sm',
}: DeleteButtonProps) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? t('deleteButton.deleteFailed'));
        return;
      }
      toast.success(successMessage ?? t('deleteButton.deletedSuccess'));
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('deleteButton.unexpectedError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="destructive" size={size} onClick={() => setOpen(true)}>
        {label ?? tc('actions.delete')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{title ?? t('deleteButton.confirmTitle')}</DialogTitle>
          <DialogDescription>{description ?? tc('confirmDialog.irreversible')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            {tc('actions.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={submitting}>
            {submitting ? tc('actions.deleting') : tc('actions.delete')}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
