'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { setLocale } from '@/app/actions/set-locale';
import { type AppLocale,LOCALES } from '@/lib/locale';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
}

// Pill ES/EN: setea la cookie NEXT_LOCALE vía server action y refresca el
// árbol server para que todo re-renderice en el idioma nuevo.
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations('common.language');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const change = (next: AppLocale) => {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };

  return (
    <div
      role="group"
      aria-label={t('change')}
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-card p-0.5 text-xs font-bold',
        pending && 'opacity-60',
        className,
      )}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => change(code)}
          aria-pressed={locale === code}
          aria-label={t(code)}
          className={cn(
            'rounded-full px-2.5 py-1 uppercase transition-colors',
            locale === code
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
