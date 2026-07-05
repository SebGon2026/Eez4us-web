// Resolución de idioma del panel/landing: cookie explícita del usuario primero,
// después geo-IP de Cloudflare (header CF-IPCountry, gratis en Workers), después
// Accept-Language del browser. Default 'es' (mercado base MX/SV).

export const LOCALES = ['es', 'en'] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'es';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

// Países hispanohablantes: geo-IP acá → español. Cualquier otro país conocido → inglés.
const SPANISH_COUNTRIES = new Set([
  'MX',
  'SV',
  'AR',
  'ES',
  'GT',
  'HN',
  'NI',
  'CR',
  'PA',
  'CO',
  'VE',
  'EC',
  'PE',
  'BO',
  'PY',
  'UY',
  'CL',
  'DO',
  'CU',
  'PR',
  'GQ',
]);

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'es' || value === 'en';
}

export function resolveLocale(input: {
  cookie?: string | null;
  ipCountry?: string | null;
  acceptLanguage?: string | null;
}): AppLocale {
  if (isAppLocale(input.cookie)) return input.cookie;

  // CF-IPCountry: ISO-2 en mayúsculas; 'XX' (desconocido) y 'T1' (Tor) no deciden.
  const country = input.ipCountry?.trim().toUpperCase();
  if (country && country.length === 2 && country !== 'XX' && country !== 'T1') {
    return SPANISH_COUNTRIES.has(country) ? 'es' : 'en';
  }

  const accept = input.acceptLanguage?.toLowerCase() ?? '';
  for (const part of accept.split(',')) {
    const tag = part.split(';')[0]?.trim();
    if (!tag) continue;
    if (tag.startsWith('es')) return 'es';
    if (tag.startsWith('en')) return 'en';
  }

  return DEFAULT_LOCALE;
}

// Mapa idioma UI → locale Intl para formatDate/formatMoney (lib/format.ts).
export function intlLocaleOf(locale: string): string {
  return locale === 'en' ? 'en-US' : 'es-MX';
}

// Idioma para comunicaciones salientes (emails/WhatsApp) según país del colegio.
// No depende del request: sirve en crons y webhooks.
export function localeForCountry(countryIso?: string | null): AppLocale {
  const iso = countryIso?.trim().toUpperCase();
  if (!iso) return DEFAULT_LOCALE;
  return SPANISH_COUNTRIES.has(iso) ? 'es' : 'en';
}
