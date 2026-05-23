import { cn } from '@/lib/utils';

const STYLES: Record<string, { label: string; className: string }> = {
  EN_CAMINO: { label: 'En camino', className: 'bg-blue-100 text-blue-800' },
  EN_ZONA: {
    label: 'En zona',
    className: 'bg-amber-100 text-amber-800 animate-pulse',
  },
  ENTREGADO: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
  CANCELADO: { label: 'Cancelado', className: 'bg-gray-200 text-gray-700' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STYLES[status] ?? { label: status, className: 'bg-gray-100 text-gray-800' };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}
