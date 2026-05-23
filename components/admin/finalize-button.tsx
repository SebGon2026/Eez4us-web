'use client';

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
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const studentsLabel = studentNames.length > 0 ? studentNames.join(', ') : 'el alumno';

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
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} disabled={isPending}>
        Finalizar entrega
      </Button>
      <Dialog open={open} onOpenChange={(o) => !isPending && setOpen(o)}>
        <DialogHeader>
          <DialogTitle>¿Confirmás entrega?</DialogTitle>
          <DialogDescription>
            Marcar entrega de <span className="font-bold text-foreground">{studentsLabel}</span>{' '}
            a <span className="font-bold text-foreground">{parentName}</span>.
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
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={isPending}>
            {isPending ? 'Finalizando…' : 'Sí, confirmar'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
