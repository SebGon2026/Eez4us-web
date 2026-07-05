'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AddressPicker, type AddressValue } from '@/components/admin/address-picker';
import { PickupPointMap, type PickupPointMapValue } from '@/components/admin/pickup-point-map';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SetupWizardProps {
  schoolId: string;
  initial: {
    name: string;
    internalCode: string;
    addressText: string;
    addressLat: number | null;
    addressLng: number | null;
  };
}

function generateCode(): string {
  const alpha = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alpha[Math.floor(Math.random() * alpha.length)];
  }
  return out;
}

// Fallback solo si la escuela todavía no tiene dirección geocodificada. El marker real se
// centra en la dirección de la escuela (efecto abajo), no en una ciudad fija.
const DEFAULT_LAT = 19.4326;
const DEFAULT_LNG = -99.1332;

export function SetupWizard({ schoolId, initial }: SetupWizardProps) {
  const t = useTranslations('schools');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial.name);
  const [address, setAddress] = useState<AddressValue>({
    addressText: initial.addressText,
    addressLat: initial.addressLat,
    addressLng: initial.addressLng,
  });
  const [internalCode, setInternalCode] = useState(initial.internalCode || generateCode());

  const [pickupName, setPickupName] = useState(t('setup.defaultPickupName'));
  const [pickupTouched, setPickupTouched] = useState(false);
  const [pickupMap, setPickupMap] = useState<PickupPointMapValue>({
    centerLat: initial.addressLat ?? DEFAULT_LAT,
    centerLng: initial.addressLng ?? DEFAULT_LNG,
    radiusMeters: 150,
  });

  // El punto de recogida arranca centrado en la dirección de la escuela. En el alta nueva la
  // dirección se geocodifica en el paso 1, así que sincronizamos el marker hasta que el
  // director lo mueva a mano (puerta lateral, etc.).
  useEffect(() => {
    if (pickupTouched) return;
    if (address.addressLat == null || address.addressLng == null) return;
    setPickupMap((m) => ({ ...m, centerLat: address.addressLat!, centerLng: address.addressLng! }));
  }, [address.addressLat, address.addressLng, pickupTouched]);

  function step1Valid() {
    return name.trim().length > 0 && address.addressText.trim().length > 0;
  }
  function step2Valid() {
    return /^[A-Z0-9]{4,12}$/.test(internalCode);
  }
  function step3Valid() {
    return pickupName.trim().length > 0;
  }

  async function onFinish() {
    setSubmitting(true);
    setError(null);
    try {
      const patchRes = await fetch(`/api/schools/${schoolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          internalCode,
          addressText: address.addressText.trim(),
          addressLat: address.addressLat,
          addressLng: address.addressLng,
        }),
      });
      if (!patchRes.ok) {
        const data = (await patchRes.json()) as { error?: string };
        setError(data.error ?? t('setup.saveSchoolFailed'));
        return;
      }

      const ppRes = await fetch(`/api/schools/${schoolId}/pickup-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pickupName.trim(),
          centerLat: pickupMap.centerLat,
          centerLng: pickupMap.centerLng,
          radiusMeters: pickupMap.radiusMeters,
        }),
      });
      if (!ppRes.ok) {
        const data = (await ppRes.json()) as { error?: string };
        setError(data.error ?? t('setup.createPickupFailed'));
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('setup.unexpectedError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-sm font-bold text-primary">{t('setup.stepOf', { step, total: 3 })}</p>
        <h1 className="text-3xl font-black">{t('setup.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('setup.subtitle')}</p>
      </div>

      <div className="flex gap-1">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={
              s <= step ? 'h-2 flex-1 rounded-full bg-primary' : 'h-2 flex-1 rounded-full bg-secondary'
            }
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="school-name">{t('setup.schoolName')}</Label>
            <Input
              id="school-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('setup.schoolNamePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('setup.address')}</Label>
            <AddressPicker
              value={address}
              onChange={setAddress}
              placeholder={t('setup.addressPlaceholder')}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="internal-code">{t('setup.internalCode')}</Label>
            <p className="text-xs text-muted-foreground">{t('setup.internalCodeHint')}</p>
            <div className="flex gap-3">
              <Input
                id="internal-code"
                value={internalCode}
                onChange={(e) => setInternalCode(e.target.value.toUpperCase())}
                maxLength={12}
                className="font-mono uppercase tracking-widest"
              />
              <Button
                variant="outline"
                type="button"
                onClick={() => setInternalCode(generateCode())}
              >
                {t('setup.suggest')}
              </Button>
            </div>
            {!step2Valid() && (
              <p className="text-xs text-destructive">{t('setup.internalCodeError')}</p>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="pp-name">{t('setup.pickupName')}</Label>
            <Input
              id="pp-name"
              value={pickupName}
              onChange={(e) => setPickupName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('setup.locationRadius')}</Label>
            <PickupPointMap
              value={pickupMap}
              onChange={(v) => {
                setPickupTouched(true);
                setPickupMap(v);
              }}
              className="h-[420px]"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button
          variant="outline"
          type="button"
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
          disabled={step === 1 || submitting}
        >
          {tCommon('actions.back')}
        </Button>
        {step < 3 ? (
          <Button
            type="button"
            onClick={() => setStep((s) => ((s + 1) as 1 | 2 | 3))}
            disabled={(step === 1 && !step1Valid()) || (step === 2 && !step2Valid())}
          >
            {t('setup.continue')}
          </Button>
        ) : (
          <Button type="button" onClick={onFinish} disabled={!step3Valid() || submitting}>
            {submitting ? tCommon('actions.saving') : t('setup.finish')}
          </Button>
        )}
      </div>
    </div>
  );
}
