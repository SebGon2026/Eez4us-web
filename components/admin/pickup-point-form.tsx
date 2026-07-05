'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

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
  const t = useTranslations('pickupPoints');
  const tc = useTranslations('common');
  const [name, setName] = useState(initial.name);
  const [map, setMap] = useState<PickupPointMapValue>({
    centerLat: initial.centerLat,
    centerLng: initial.centerLng,
    radiusMeters: initial.radiusMeters,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buffers de texto de los inputs manuales de coordenadas. Existen para poder tipear
  // valores parciales ("-99." o "") sin que el binding numérico los pise, y para que el
  // director pueda fijar el punto AUNQUE el mapa no cargue (key de Maps caída, etc.).
  const [latText, setLatText] = useState(String(initial.centerLat));
  const [lngText, setLngText] = useState(String(initial.centerLng));
  const [radiusText, setRadiusText] = useState(String(initial.radiusMeters));

  // Sincroniza los buffers cuando el valor cambia por fuera (arrastre del marker o slider
  // del mapa). No pisa mientras se tipea: solo actualiza si el número ya difiere del buffer.
  useEffect(() => {
    if (Number.parseFloat(latText) !== map.centerLat) setLatText(String(map.centerLat));
  }, [map.centerLat]);
  useEffect(() => {
    if (Number.parseFloat(lngText) !== map.centerLng) setLngText(String(map.centerLng));
  }, [map.centerLng]);
  useEffect(() => {
    if (Number.parseInt(radiusText, 10) !== map.radiusMeters) setRadiusText(String(map.radiusMeters));
  }, [map.radiusMeters]);

  function onLatChange(raw: string) {
    setLatText(raw);
    const v = Number.parseFloat(raw);
    if (!Number.isNaN(v) && v >= -90 && v <= 90) setMap((m) => ({ ...m, centerLat: v }));
  }
  function onLngChange(raw: string) {
    setLngText(raw);
    const v = Number.parseFloat(raw);
    if (!Number.isNaN(v) && v >= -180 && v <= 180) setMap((m) => ({ ...m, centerLng: v }));
  }
  function onRadiusChange(raw: string) {
    setRadiusText(raw);
    const v = Number.parseInt(raw, 10);
    // Mismo rango que el slider del mapa y el server (z.number().int().min(50).max(500)).
    if (!Number.isNaN(v) && v >= 50 && v <= 500) setMap((m) => ({ ...m, radiusMeters: v }));
  }

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
        setError(data.error ?? t('form.saveError'));
        return;
      }
      router.push('/admin/pickup-points');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('form.unexpectedError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="pp-name">{tc('fields.name')}</Label>
        <Input
          id="pp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('form.namePlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('form.locationAndRadius')}</Label>
        <PickupPointMap value={map} onChange={setMap} className="h-[420px]" />
      </div>

      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <div>
          <Label>{t('form.manualCoords')}</Label>
          <p className="text-xs text-muted-foreground">{t('form.manualCoordsHint')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="pp-lat">{t('form.latitude')}</Label>
            <Input
              id="pp-lat"
              type="number"
              step="any"
              inputMode="decimal"
              value={latText}
              onChange={(e) => onLatChange(e.target.value)}
              placeholder="19.4326"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-lng">{t('form.longitude')}</Label>
            <Input
              id="pp-lng"
              type="number"
              step="any"
              inputMode="decimal"
              value={lngText}
              onChange={(e) => onLngChange(e.target.value)}
              placeholder="-99.1332"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-radius">{t('form.radiusMeters')}</Label>
            <Input
              id="pp-radius"
              type="number"
              min={50}
              max={500}
              step={5}
              inputMode="numeric"
              value={radiusText}
              onChange={(e) => onRadiusChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/admin/pickup-points')}
          disabled={submitting}
        >
          {tc('actions.cancel')}
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={submitting || name.trim().length === 0}
        >
          {submitting ? tc('actions.saving') : tc('actions.save')}
        </Button>
      </div>
    </div>
  );
}
