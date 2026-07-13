import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// lib/billing importa lib/db, que instancia PrismaClient+Accelerate al cargar el módulo
// (sin DATABASE_URL en test tira un rejection). isBillingLocked/resolveProvider no tocan la
// DB, así que un stub vacío alcanza para no arrastrar ese side-effect.
vi.mock('@/lib/db', () => ({ prisma: {} }));

import { isBillingLocked, resolveProvider } from '@/lib/billing';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-07-13T12:00:00.000Z');

describe('resolveProvider', () => {
  it('rutea México/MXN a openpay y el resto a stripe', () => {
    expect(resolveProvider({ currency: 'MXN' })).toBe('openpay');
    expect(resolveProvider({ country: 'México' })).toBe('openpay');
    expect(resolveProvider({ country: 'MX' })).toBe('openpay');
    expect(resolveProvider({ currency: 'USD', country: 'US' })).toBe('stripe');
    expect(resolveProvider({ country: null, currency: null })).toBe('stripe');
  });
});

describe('isBillingLocked', () => {
  const OLD_ENV = process.env.BILLING_BLOCK_ON_PAST_DUE;
  beforeEach(() => {
    delete process.env.BILLING_BLOCK_ON_PAST_DUE; // default = habilitado
  });
  afterEach(() => {
    if (OLD_ENV === undefined) delete process.env.BILLING_BLOCK_ON_PAST_DUE;
    else process.env.BILLING_BLOCK_ON_PAST_DUE = OLD_ENV;
  });

  it('no bloquea si no hay suscripción', () => {
    expect(isBillingLocked(null, NOW)).toBe(false);
  });

  it('no bloquea si no está en mora', () => {
    expect(
      isBillingLocked(
        { status: 'ACTIVE', gracePeriodDays: 7, pastDueSince: new Date(NOW.getTime() - 100 * DAY) },
        NOW,
      ),
    ).toBe(false);
    expect(isBillingLocked({ status: 'TRIALING', gracePeriodDays: 7, pastDueSince: null }, NOW)).toBe(
      false,
    );
  });

  it('DENTRO de la gracia no bloquea (solo banner)', () => {
    const since = new Date(NOW.getTime() - 3 * DAY); // 3 días en mora, gracia 7
    expect(isBillingLocked({ status: 'PAST_DUE', gracePeriodDays: 7, pastDueSince: since }, NOW)).toBe(
      false,
    );
  });

  it('PASADA la gracia bloquea', () => {
    const since = new Date(NOW.getTime() - 8 * DAY); // 8 días en mora, gracia 7
    expect(isBillingLocked({ status: 'PAST_DUE', gracePeriodDays: 7, pastDueSince: since }, NOW)).toBe(
      true,
    );
  });

  it('justo en el límite (día exacto) todavía no bloquea', () => {
    const since = new Date(NOW.getTime() - 7 * DAY); // exactamente 7 días
    expect(isBillingLocked({ status: 'PAST_DUE', gracePeriodDays: 7, pastDueSince: since }, NOW)).toBe(
      false,
    );
  });

  it('gracia 0 = corte inmediato apenas pasa un instante de mora', () => {
    const since = new Date(NOW.getTime() - 1000); // 1s en mora
    expect(isBillingLocked({ status: 'PAST_DUE', gracePeriodDays: 0, pastDueSince: since }, NOW)).toBe(
      true,
    );
  });

  it('gracia por colegio: 30 días no bloquea a los 10 días de mora', () => {
    const since = new Date(NOW.getTime() - 10 * DAY);
    expect(
      isBillingLocked({ status: 'PAST_DUE', gracePeriodDays: 30, pastDueSince: since }, NOW),
    ).toBe(false);
  });

  it('sin pastDueSince cae a updatedAt como fallback conservador', () => {
    const updatedAt = new Date(NOW.getTime() - 20 * DAY);
    expect(
      isBillingLocked({ status: 'PAST_DUE', gracePeriodDays: 7, pastDueSince: null, updatedAt }, NOW),
    ).toBe(true);
    // Sin ninguna referencia temporal, no bloquea (no hay cómo medir la gracia).
    expect(isBillingLocked({ status: 'PAST_DUE', gracePeriodDays: 7, pastDueSince: null }, NOW)).toBe(
      false,
    );
  });

  it('BILLING_BLOCK_ON_PAST_DUE=false desactiva el corte globalmente (solo banner)', () => {
    process.env.BILLING_BLOCK_ON_PAST_DUE = 'false';
    const since = new Date(NOW.getTime() - 30 * DAY);
    expect(isBillingLocked({ status: 'PAST_DUE', gracePeriodDays: 7, pastDueSince: since }, NOW)).toBe(
      false,
    );
  });
});
