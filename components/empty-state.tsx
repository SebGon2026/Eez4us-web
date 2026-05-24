import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <div className="rounded-3xl bg-primary/10 p-5">
        <Icon className="size-10 text-primary" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-black text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
