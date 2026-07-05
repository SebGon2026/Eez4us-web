import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

const STYLES: Record<string, string> = {
  EN_CAMINO: 'bg-blue-50 text-blue-900 border border-blue-200',
  EN_ZONA: 'bg-amber-100 text-amber-900 border border-amber-300',
  ENTREGADO: 'bg-green-50 text-green-900 border border-green-200',
  CANCELADO: 'bg-secondary text-muted-foreground border border-border',
};

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('nav');
  const className = STYLES[status] ?? 'bg-secondary text-foreground border border-border';
  const label = status in STYLES ? t(`status.${status}`) : status;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
        className,
      )}
    >
      {label}
    </span>
  );
}
