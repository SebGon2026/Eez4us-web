'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

interface OpenPayTokenResponse {
  data: { id: string };
}

interface OpenPayGlobal {
  setId(_id: string): void;
  setApiKey(_key: string): void;
  setSandboxMode(_value: boolean): void;
  token: {
    create(
      _card: Record<string, string>,
      _success: (_r: OpenPayTokenResponse) => void,
      _error: (_e: unknown) => void,
    ): void;
  };
  deviceData: { setup(_formId?: string, _buttonId?: string): string };
}

const MERCHANT_ID = process.env.NEXT_PUBLIC_OPENPAY_MERCHANT_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_OPENPAY_PUBLIC_KEY;
// Sandbox por defecto; poné NEXT_PUBLIC_OPENPAY_SANDBOX=false para producción.
const SANDBOX = process.env.NEXT_PUBLIC_OPENPAY_SANDBOX !== 'false';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function readOpenPay(): OpenPayGlobal | null {
  return (window as unknown as { OpenPay?: OpenPayGlobal }).OpenPay ?? null;
}

const INPUT_CLASS =
  'rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40';

export function OpenpayBillingActions({ hasCard }: { hasCard: boolean }) {
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deviceSessionId = useRef<string | null>(null);
  const [form, setForm] = useState({ holder: '', number: '', month: '', year: '', cvv: '' });

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!MERCHANT_ID || !PUBLIC_KEY) {
        setError('Faltan las llaves públicas de Openpay (NEXT_PUBLIC_OPENPAY_*).');
        return;
      }
      try {
        await loadScript('https://js.openpay.mx/openpay.v1.min.js');
        await loadScript('https://js.openpay.mx/openpay-data.v1.min.js');
        if (cancelled) return;
        const op = readOpenPay();
        if (!op) {
          setError('No se pudo cargar Openpay.js');
          return;
        }
        op.setId(MERCHANT_ID);
        op.setApiKey(PUBLIC_KEY);
        op.setSandboxMode(SANDBOX);
        deviceSessionId.current = op.deviceData.setup();
        setReady(true);
      } catch {
        if (!cancelled) setError('No se pudo cargar Openpay.js');
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    setError(null);
    const op = readOpenPay();
    if (!op || !deviceSessionId.current) {
      setError('Openpay no está listo todavía.');
      return;
    }
    setSubmitting(true);
    op.token.create(
      {
        card_number: form.number.replace(/\s+/g, ''),
        holder_name: form.holder,
        expiration_year: form.year,
        expiration_month: form.month,
        cvv2: form.cvv,
      },
      async (resp) => {
        try {
          const res = await fetch('/api/billing/openpay/save-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenId: resp.data.id,
              deviceSessionId: deviceSessionId.current,
            }),
          });
          const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
          if (!res.ok) {
            setError((data?.error as string) ?? `HTTP ${res.status}`);
            setSubmitting(false);
            return;
          }
          window.location.reload();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Error desconocido');
          setSubmitting(false);
        }
      },
      (err) => {
        const desc =
          (err as { data?: { description?: string } })?.data?.description ??
          'No se pudo validar la tarjeta';
        setError(desc);
        setSubmitting(false);
      },
    );
  }

  return (
    <div className="space-y-4">
      {hasCard && (
        <p className="text-sm text-muted-foreground">
          Ya hay una tarjeta archivada. Cargá una nueva para reemplazarla.
        </p>
      )}
      <div className="grid max-w-md gap-3">
        <input
          className={INPUT_CLASS}
          placeholder="Nombre del titular"
          autoComplete="cc-name"
          value={form.holder}
          onChange={(e) => set('holder', e.target.value)}
        />
        <input
          className={INPUT_CLASS}
          placeholder="Número de tarjeta"
          inputMode="numeric"
          autoComplete="cc-number"
          value={form.number}
          onChange={(e) => set('number', e.target.value)}
        />
        <div className="grid grid-cols-3 gap-3">
          <input
            className={INPUT_CLASS}
            placeholder="MM"
            inputMode="numeric"
            maxLength={2}
            value={form.month}
            onChange={(e) => set('month', e.target.value)}
          />
          <input
            className={INPUT_CLASS}
            placeholder="AA"
            inputMode="numeric"
            maxLength={2}
            value={form.year}
            onChange={(e) => set('year', e.target.value)}
          />
          <input
            className={INPUT_CLASS}
            placeholder="CVV"
            inputMode="numeric"
            maxLength={4}
            autoComplete="cc-csc"
            value={form.cvv}
            onChange={(e) => set('cvv', e.target.value)}
          />
        </div>
        <Button onClick={submit} disabled={!ready || submitting}>
          {submitting
            ? 'Guardando…'
            : hasCard
              ? 'Reemplazar tarjeta'
              : 'Guardar tarjeta y activar'}
        </Button>
      </div>
      {!ready && !error && (
        <p className="text-xs text-muted-foreground">Cargando Openpay…</p>
      )}
      {error && (
        <span className="inline-block rounded-2xl bg-destructive/10 px-3 py-1 text-sm font-bold text-destructive">
          {error}
        </span>
      )}
      <p className="text-xs text-muted-foreground">
        Procesado por Openpay (BBVA). Los datos de la tarjeta no pasan por nuestros servidores.
      </p>
    </div>
  );
}
