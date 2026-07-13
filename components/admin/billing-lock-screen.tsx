import { getTranslations } from 'next-intl/server';

import { BillingActions } from '@/components/admin/billing-actions';
import { OpenpayBillingActions } from '@/components/admin/openpay-billing-actions';

// Takeover de pago cuando la suscripción del colegio agotó la gracia (ver isBillingLocked).
// Se renderiza EN LUGAR del contenido del panel para el director — no es un redirect, así
// que no depende del pathname (que el middleware de OpenNext no puede inyectar sin romper la
// sesión) ni entra en loop con /admin/billing. El director solo puede regularizar el pago:
// al hacerlo la suscripción sale de PAST_DUE y el layout deja de bloquear.
export async function BillingLockScreen({ provider }: { provider: 'openpay' | 'stripe' }) {
  const t = await getTranslations('billing');

  return (
    <div className="flex min-h-full items-center justify-center overflow-y-auto p-6">
      <div className="w-full max-w-lg space-y-5 rounded-2xl border border-destructive/30 bg-card p-8 shadow-pop">
        <div className="space-y-2 text-center">
          <span className="inline-block rounded-full bg-destructive/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-destructive">
            {t('lock.badge')}
          </span>
          <h1 className="text-2xl font-black text-foreground">{t('lock.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('lock.body')}</p>
        </div>

        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          {provider === 'openpay' ? (
            <OpenpayBillingActions hasCard={false} />
          ) : (
            <BillingActions hasSubscription={true} />
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">{t('lock.footer')}</p>
      </div>
    </div>
  );
}
