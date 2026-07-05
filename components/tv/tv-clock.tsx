'use client';

import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

import { intlLocaleOf } from '@/lib/locale';

export function TvClock() {
  const locale = useLocale();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const text = now
    ? now.toLocaleTimeString(intlLocaleOf(locale), {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : '--:--:--';

  return (
    <span className="font-bold tabular-nums" style={{ color: 'var(--tv-fg2)' }}>
      {text}
    </span>
  );
}
