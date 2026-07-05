'use client';

import { useTranslations } from 'next-intl';
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
  { key: 'green', hue: 142 },
  { key: 'emerald', hue: 168 },
  { key: 'turquoise', hue: 190 },
  { key: 'blue', hue: 211 },
  { key: 'indigo', hue: 245 },
  { key: 'purple', hue: 280 },
  { key: 'fuchsia', hue: 308 },
  { key: 'pink', hue: 326 },
  { key: 'red', hue: 354 },
  { key: 'orange', hue: 24 },
  { key: 'amber', hue: 45 },
  { key: 'lime', hue: 96 },
];

const MAX_LOGO_BYTES = 300 * 1024;

const LOCALE_OPTIONS: { value: 'es-MX' | 'es-AR'; key: 'esMX' | 'esAR' }[] = [
  { value: 'es-MX', key: 'esMX' },
  { value: 'es-AR', key: 'esAR' },
];

const DENSITY_OPTIONS: {
  value: 'compact' | 'comfortable' | 'spacious';
  bars: number[];
}[] = [
  { value: 'compact', bars: [4, 4, 4] },
  { value: 'comfortable', bars: [6, 6, 6] },
  { value: 'spacious', bars: [9, 9, 9] },
];

export function SchoolSettingsForm({ initial }: Props) {
  const t = useTranslations('schools');
  const tCommon = useTranslations('common');
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
      toast.error(t('settings.logoTooBig'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setLogoUrl(reader.result);
    };
    reader.onerror = () => toast.error(t('settings.fileReadError'));
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
      toast.success(t('settings.saved'));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('settings.saveFailed'));
    } finally {
      setPending(false);
    }
  }

  async function onRegenCode() {
    if (!confirm(t('settings.confirmRegenCode'))) return;
    setRegen(true);
    try {
      const res = await fetch('/api/admin/school/regenerate-code', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { internalCode: string };
      setCode(data.internalCode);
      toast.success(t('settings.newCode', { code: data.internalCode }));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('settings.regenFailed'));
    } finally {
      setRegen(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      {/* ── Identidad ───────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('settings.identity')}</CardTitle>
          <CardDescription>{t('settings.identityDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{tCommon('fields.name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>{t('settings.address')}</Label>
            <Input value={addressText} onChange={(e) => setAddressText(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('settings.latitude')}</Label>
              <Input
                value={addressLat}
                onChange={(e) => setAddressLat(e.target.value)}
                placeholder="19.432608"
              />
            </div>
            <div>
              <Label>{t('settings.longitude')}</Label>
              <Input
                value={addressLng}
                onChange={(e) => setAddressLng(e.target.value)}
                placeholder="-99.133209"
              />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-4">
            <Label>{t('settings.accessCode')}</Label>
            <div className="mt-2 flex items-center gap-2">
              <code className="rounded-lg bg-card px-3 py-2 text-sm font-bold border border-border">
                {code}
              </code>
              <Button type="button" variant="outline" onClick={onRegenCode} disabled={regen}>
                {regen ? t('settings.regenerating') : t('settings.regenerate')}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t('settings.accessCodeHint')}</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Apariencia ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('settings.appearance')}</CardTitle>
          <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              <div>
                <Label>{t('settings.schoolLogo')}</Label>
                <p className="mb-2 text-xs text-muted-foreground">{t('settings.logoHint')}</p>
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
                        {t('settings.change')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setLogoUrl('')}
                        className="text-destructive hover:text-destructive"
                      >
                        {t('settings.remove')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-secondary/20 px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <span className="text-sm font-bold">{t('settings.uploadLogo')}</span>
                    <span className="text-xs text-muted-foreground">
                      {t('settings.clickToChoose')}
                    </span>
                  </button>
                )}
              </div>
              <div>
                <Label>{t('settings.primaryColor')}</Label>
                <p className="mb-2 text-xs text-muted-foreground">
                  {t('settings.primaryColorHint')}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {HUE_PRESETS.map((p) => (
                    <button
                      key={p.hue}
                      type="button"
                      onClick={() => setBrandHue(p.hue)}
                      aria-label={t(`settings.hues.${p.key}`)}
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
                      {t('settings.reset')}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Label>{t('settings.accentColor')}</Label>
                <p className="mb-2 text-xs text-muted-foreground">
                  {t('settings.accentColorHint')}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {HUE_PRESETS.map((p) => (
                    <button
                      key={p.hue}
                      type="button"
                      onClick={() => setBrandHueSecondary(p.hue)}
                      aria-label={t(`settings.hues.${p.key}`)}
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
                      {t('settings.reset')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mini preview en vivo */}
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('settings.preview')}
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
                <span className="truncate text-xs font-bold">
                  {name || t('settings.yourSchool')}
                </span>
              </div>
              <div
                className="mt-2 h-9 w-44 rounded-lg text-center text-xs font-bold leading-9 text-white"
                style={{ background: `hsl(${previewHue} 55% 36%)` }}
              >
                {t('settings.primaryButton')}
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
                    {t('settings.metric')}
                  </p>
                  <p className="text-base font-bold leading-none">128</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>{t('settings.uiDensity')}</Label>
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
                    <p className="text-sm font-bold leading-tight">
                      {t(`settings.density.${opt.value}.label`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`settings.density.${opt.value}.hint`)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t('settings.densityApplyHint')}</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Idioma / Región ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('settings.languageRegion')}</CardTitle>
          <CardDescription>{t('settings.languageRegionDesc')}</CardDescription>
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
                  <p className="text-sm font-bold leading-tight">
                    {t(`settings.localeOptions.${opt.key}.label`)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t(`settings.localeOptions.${opt.key}.hint`)}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? tCommon('actions.saving') : t('settings.saveChanges')}
        </Button>
      </div>
    </form>
  );
}
