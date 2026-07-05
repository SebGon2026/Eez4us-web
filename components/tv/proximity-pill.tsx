import { useTranslations } from 'next-intl';

import type { RosterProximity } from '@/lib/trip-types';
import { cn } from '@/lib/utils';

const STYLES: Record<RosterProximity, { labelKey: 'atGate' | 'near' | 'onTheWay'; bg: string; fg: string; bd: string }> = {
  EN_PUERTA: { labelKey: 'atGate', bg: 'var(--tv-emerald-pill)', fg: 'var(--tv-emerald)', bd: 'var(--tv-emerald-pill-bd)' },
  CERCA: { labelKey: 'near', bg: 'var(--tv-amber-pill)', fg: 'var(--tv-amber)', bd: 'var(--tv-amber-pill-bd)' },
  EN_CAMINO: { labelKey: 'onTheWay', bg: 'var(--tv-sky-pill)', fg: 'var(--tv-sky)', bd: 'var(--tv-sky-pill-bd)' },
};

export function ProximityPill({
  proximity,
  className,
}: {
  proximity: RosterProximity;
  className?: string;
}) {
  const t = useTranslations('tv');
  const cfg = STYLES[proximity];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-black',
        className,
      )}
      style={{ background: cfg.bg, color: cfg.fg, borderColor: cfg.bd }}
    >
      {t(`proximity.${cfg.labelKey}`)}
    </span>
  );
}
