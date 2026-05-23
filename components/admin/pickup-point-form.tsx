'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PickupPointMap, type PickupPointMapValue } from '@/components/admin/pickup-point-map';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PickupPointFormProps {
  schoolId: string;
  pickupPointId?: string;
  initial: {
    name: string;
    centerLat: number;
    centerLng: number;
    radiusMeters: number;
  };
}

export function PickupPointForm({ schoolId, pickupPointId, initial }: PickupPointFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [map, setMap] = useState<PickupPointMapValue>({
    centerLat: initial.centerLat,
    centerLng: initial.centerLng,
    radiusMeters: initial.radiusMeters,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    setSubmitting(true);
    setError(null);
    try {
      const url = pickupPointId
        ? `/api/schools/${schoolId}/pickup-points/${pickupPointId}`
        : `/api/schools/${schoolId}/pickup-points`;
      const res = await fetch(url, {
        method: pickupPointId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          centerLat: map.centerLat,
          centerLng: map.centerLng,
          radiusMeters: map.radiusMeters,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'No se pudo guardar');
        return;
      }
      router.push('/admin/pickup-points');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="pp-name">Nombre</Label>
        <Input
          id="pp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Puerta principal"
        />
      </div>

      <div className="space-y-2">
        <Label>Ubicación y radio</Label>
        <PickupPointMap value={map} onChange={setMap} className="h-[420px]" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/admin/pickup-points')}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={submitting || name.trim().length === 0}
        >
          {submitting ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
