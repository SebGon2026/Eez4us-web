'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  initial: {
    name: string;
    internalCode: string;
    addressText: string;
    addressLat: number | null;
    addressLng: number | null;
    logoUrl: string | null;
    brandHue: number | null;
    brandHueSecondary: number | null;
    locale: string;
    density: string;
  };
}

const HUE_PRESETS = [
  { label: 'Verde', hue: 142 },
  { label: 'Esmeralda', hue: 168 },
  { label: 'Turquesa', hue: 190 },
  { label: 'Azul', hue: 211 },
  { label: 'Índigo', hue: 245 },
  { label: 'Morado', hue: 280 },
  { label: 'Fucsia', hue: 308 },
  { label: 'Rosa', hue: 326 },
  { label: 'Rojo', hue: 354 },
  { label: 'Naranja', hue: 24 },
  { label: 'Ámbar', hue: 45 },
  { label: 'Lima', hue: 96 },
];

const MAX_LOGO_BYTES = 300 * 1024;

const LOCALE_OPTIONS: { value: 'es-MX' | 'es-AR'; label: string; hint: string }[] = [
  {
    value: 'es-MX',
    label: 'Español (Latinoamérica / México)',
    hint: 'Imperativo neutro: «carga», «define», «elimina».',
  },
  {
    value: 'es-AR',
    label: 'Español (Argentina / Rioplatense)',
    hint: 'Voseo: «cargá», «definí», «eliminá».',
  },
];

const DENSITY_OPTIONS: {
  value: 'compact' | 'comfortable' | 'spacious';
  label: string;
  hint: string;
  bars: number[];
}[] = [
  { value: 'compact', label: 'Compacto', hint: 'Más información a la vista.', bars: [4, 4, 4] },
  { value: 'comfortable', label: 'Cómodo', hint: 'Equilibrio recomendado.', bars: [6, 6, 6] },
  { value: 'spacious', label: 'Espacioso', hint: 'Máximo aire entre bloques.', bars: [9, 9, 9] },
];

export function SchoolSettingsForm({ initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [addressText, setAddressText] = useState(initial.addressText);
  const [addressLat, setAddressLat] = useState<string>(
    initial.addressLat != null ? String(initial.addressLat) : '',
  );
  const [addressLng, setAddressLng] = useState<string>(
    initial.addressLng != null ? String(initial.addressLng) : '',
  );
  const [code, setCode] = useState(initial.internalCode);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? '');
  const [brandHue, setBrandHue] = useState<number | null>(initial.brandHue);
  const [brandHueSecondary, setBrandHueSecondary] = useState<number | null>(
    initial.brandHueSecondary,
  );
  const [locale, setLocale] = useState<'es-MX' | 'es-AR'>(
    initial.locale === 'es-AR' ? 'es-AR' : 'es-MX',
  );
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>(
    initial.density === 'compact' || initial.density === 'spacious'
      ? initial.density
      : 'comfortable',
  );
  const [pending, setPending] = useState(false);
  const [regen, setRegen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('El logo supera los 300 KB. Usa una imagen más liviana.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setLogoUrl(reader.result);
    };
    reader.onerror = () => toast.error('No se pudo leer el archivo');
    reader.readAsDataURL(file);
  }

  const previewHue = brandHue ?? 142;
  const previewAccent = brandHueSecondary ?? brandHue ?? 142;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const lat = addressLat.trim() ? Number(addressLat) : null;
      const lng = addressLng.trim() ? Number(addressLng) : null;
      const res = await fetch('/api/admin/school/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          addressText,
          addressLat: lat,
          addressLng: lng,
          logoUrl: logoUrl.trim() ? logoUrl.trim() : null,
          brandHue,
          brandHueSecondary,
          locale,
          density,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Cambios guardados');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setPending(false);
    }
  }

  async function onRegenCode() {
    if (!confirm('¿Regenerar código de acceso del colegio?')) return;
    setRegen(true);
    try {
      const res = await fetch('/api/admin/school/regenerate-code', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { internalCode: string };
      setCode(data.internalCode);
      toast.success(`Nuevo código: ${data.internalCode}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo regenerar');
    } finally {
      setRegen(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      {/* ── Identidad ───────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Identidad</CardTitle>
          <CardDescription>Nombre, ubicación y código de acceso del colegio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Dirección</Label>
            <Input value={addressText} onChange={(e) => setAddressText(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Latitud</Label>
              <Input
                value={addressLat}
                onChange={(e) => setAddressLat(e.target.value)}
                placeholder="19.432608"
              />
            </div>
            <div>
              <Label>Longitud</Label>
              <Input
                value={addressLng}
                onChange={(e) => setAddressLng(e.target.value)}
                placeholder="-99.133209"
              />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-4">
            <Label>Código de acceso</Label>
            <div className="mt-2 flex items-center gap-2">
              <code className="rounded-lg bg-card px-3 py-2 text-sm font-bold border border-border">
                {code}
              </code>
              <Button type="button" variant="outline" onClick={onRegenCode} disabled={regen}>
                {regen ? 'Regenerando…' : 'Regenerar'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Compártelo con tus directores y padres — lo escriben en la pantalla de login para
              llegar a la versión personalizada del colegio.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Apariencia ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Apariencia</CardTitle>
          <CardDescription>Cómo se ve el panel: logo, color de marca y densidad.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              <div>
                <Label>Logo del colegio</Label>
                <p className="mb-2 text-xs text-muted-foreground">
                  PNG, SVG, JPG o WebP con fondo transparente. Máx. 300 KB.
                </p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onLogoFile}
                />
                {logoUrl ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-12 w-12 rounded-lg border border-border bg-white object-contain"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        Cambiar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setLogoUrl('')}
                        className="text-destructive hover:text-destructive"
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-secondary/20 px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <span className="text-sm font-bold">Subir logo</span>
                    <span className="text-xs text-muted-foreground">
                      Haz clic para elegir un archivo
                    </span>
                  </button>
                )}
              </div>
              <div>
                <Label>Color de marca (primario)</Label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Sidebar, botones y estados activos.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {HUE_PRESETS.map((p) => (
                    <button
                      key={p.hue}
                      type="button"
                      onClick={() => setBrandHue(p.hue)}
                      aria-label={p.label}
                      className={
                        'h-9 w-9 rounded-full border-2 transition-all ' +
                        (brandHue === p.hue
                          ? 'border-foreground scale-110 shadow-card'
                          : 'border-white ring-1 ring-border')
                      }
                      style={{ background: `hsl(${p.hue} 60% 42%)` }}
                    />
                  ))}
                  {brandHue != null && (
                    <button
                      type="button"
                      onClick={() => setBrandHue(null)}
                      className="rounded-full border border-input px-3 py-1.5 text-xs font-bold hover:bg-secondary"
                    >
                      Restablecer
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Label>Color de acento (secundario)</Label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Íconos y bandas de las tarjetas. Si no eliges, usa el primario.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {HUE_PRESETS.map((p) => (
                    <button
                      key={p.hue}
                      type="button"
                      onClick={() => setBrandHueSecondary(p.hue)}
                      aria-label={p.label}
                      className={
                        'h-9 w-9 rounded-full border-2 transition-all ' +
                        (brandHueSecondary === p.hue
                          ? 'border-foreground scale-110 shadow-card'
                          : 'border-white ring-1 ring-border')
                      }
                      style={{ background: `hsl(${p.hue} 62% 45%)` }}
                    />
                  ))}
                  {brandHueSecondary != null && (
                    <button
                      type="button"
                      onClick={() => setBrandHueSecondary(null)}
                      className="rounded-full border border-input px-3 py-1.5 text-xs font-bold hover:bg-secondary"
                    >
                      Restablecer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mini preview en vivo */}
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Vista previa
              </p>
              <div className="flex w-44 items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-card">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-8 w-8 rounded-md object-contain border border-border bg-white"
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-black text-white"
                    style={{ background: `hsl(${previewHue} 55% 36%)` }}
                  >
                    {(name || 'EZ')
                      .split(/\s+/)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                )}
                <span className="truncate text-xs font-bold">{name || 'Tu colegio'}</span>
              </div>
              <div
                className="mt-2 h-9 w-44 rounded-lg text-center text-xs font-bold leading-9 text-white"
                style={{ background: `hsl(${previewHue} 55% 36%)` }}
              >
                Botón primario
              </div>

              {/* Tile con banda + ícono en color de acento */}
              <div className="mt-2 w-44 overflow-hidden rounded-lg border border-border bg-card">
                <div
                  className="flex items-center justify-between px-2 py-1.5"
                  style={{ background: `hsl(${previewAccent} 62% 45% / 0.14)` }}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md border bg-card text-[10px] font-black"
                    style={{
                      borderColor: `hsl(${previewAccent} 62% 45% / 0.5)`,
                      color: `hsl(${previewAccent} 62% 45%)`,
                    }}
                  >
                    ★
                  </span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: `hsl(${previewAccent} 62% 45%)` }}
                  >
                    ↗
                  </span>
                </div>
                <div className="px-2 py-1.5">
                  <p className="text-[8px] font-semibold uppercase text-muted-foreground">
                    Métrica
                  </p>
                  <p className="text-base font-bold leading-none">128</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>Densidad de la interfaz</Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {DENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDensity(opt.value)}
                  className={
                    'flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-colors ' +
                    (density === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-secondary/40')
                  }
                >
                  <div className="flex w-full flex-col" style={{ gap: opt.value === 'compact' ? 3 : opt.value === 'spacious' ? 9 : 6 }}>
                    {opt.bars.map((_, i) => (
                      <span key={i} className="h-1.5 w-full rounded bg-muted-foreground/30" />
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.hint}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Se aplica al guardar y recargar el panel.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Idioma / Región ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Idioma / Región</CardTitle>
          <CardDescription>Variante de español usada en los textos del panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {LOCALE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={
                  'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors ' +
                  (locale === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-secondary/40')
                }
              >
                <input
                  type="radio"
                  name="locale"
                  value={opt.value}
                  checked={locale === opt.value}
                  onChange={() => setLocale(opt.value)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{opt.hint}</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
