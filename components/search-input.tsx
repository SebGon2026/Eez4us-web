'use client';

import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface SearchInputProps {
  placeholder?: string;
  paramName?: string;
  debounceMs?: number;
}

export function SearchInput({
  placeholder,
  paramName = 'q',
  debounceMs = 300,
}: SearchInputProps) {
  const t = useTranslations('nav');
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get(paramName) ?? '';
  const [value, setValue] = useState(initial);

  useEffect(() => {
    setValue(searchParams.get(paramName) ?? '');
  }, [paramName, searchParams]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(paramName, value);
      } else {
        params.delete(paramName);
      }
      params.delete('page');
      router.replace(`?${params.toString()}`, { scroll: false });
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [value, paramName, debounceMs]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? t('search.placeholder')}
        className="w-full rounded-3xl border-2 border-input bg-background py-2.5 pl-11 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={t('search.clear')}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
