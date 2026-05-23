'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DeleteButtonProps {
  url: string;
  label?: string;
  title?: string;
  description?: string;
  size?: 'default' | 'sm';
}

export function DeleteButton({
  url,
  label = 'Eliminar',
  title = 'Confirmar eliminación',
  description = 'Esta acción no se puede deshacer.',
  size = 'sm',
}: DeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'No se pudo eliminar');
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="destructive" size={size} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
