'use client';

import { useEffect, useState } from 'react';

interface TripETAProps {
  etaSeconds: number | null;
  etaUpdatedAt: string | null;
}

function format(remaining: number): { text: string; arriving: boolean } {
  if (remaining <= 30) return { text: 'Llegando', arriving: true };
  const total = Math.floor(remaining);
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return { text: `${mm}:${ss}`, arriving: false };
}

export function TripETA({ etaSeconds, etaUpdatedAt }: TripETAProps) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (etaSeconds == null || etaUpdatedAt == null) {
    return <p className="text-4xl font-black tabular-nums text-muted-foreground">—:—</p>;
  }

  const updatedAtMs = new Date(etaUpdatedAt).getTime();
  const elapsedSec = Math.max(0, (now - updatedAtMs) / 1000);
  const remaining = Math.max(0, etaSeconds - elapsedSec);
  const { text, arriving } = format(remaining);

  return (
    <p
      className={
        'text-4xl font-black tabular-nums ' +
        (arriving ? 'text-amber-600' : 'text-foreground')
      }
    >
      {text}
    </p>
  );
}
