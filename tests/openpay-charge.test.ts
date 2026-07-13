import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    subscription: { findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    invoice: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    student: { count: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock('@/lib/openpay', () => ({
  chargeSavedCard: vi.fn(),
  OpenpayError: class OpenpayError extends Error {
    errorCode?: number;
    constructor(code?: number) {
      super('openpay');
      this.errorCode = code;
    }
  },
}));

import { runDueOpenpayCharges } from '@/lib/billing';
import { prisma } from '@/lib/db';
import { chargeSavedCard, OpenpayError } from '@/lib/openpay';

type Mock = ReturnType<typeof vi.fn>;
const subFindMany = prisma.subscription.findMany as unknown as Mock;
const subUpdate = prisma.subscription.update as unknown as Mock;
const subUpdateMany = prisma.subscription.updateMany as unknown as Mock;
const invFindUnique = prisma.invoice.findUnique as unknown as Mock;
const invCreate = prisma.invoice.create as unknown as Mock;
const invUpdate = prisma.invoice.update as unknown as Mock;
const studentCount = prisma.student.count as unknown as Mock;
const charge = chargeSavedCard as unknown as Mock;

const NOW = new Date('2026-07-13T12:00:00.000Z');

function dueSub(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: 'sch1',
    pricePerStudent: 99,
    currency: 'MXN',
    nextChargeAt: new Date('2026-07-01T00:00:00.000Z'),
    openpayCardId: 'card_1',
    openpayDeviceSessionId: 'dev_1',
    school: { openpayCustomerId: 'cust_1' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  invFindUnique.mockResolvedValue(null);
  invCreate.mockResolvedValue({ id: 'inv_new' });
  invUpdate.mockResolvedValue({});
  subUpdate.mockResolvedValue({});
  subUpdateMany.mockResolvedValue({ count: 1 });
});

describe('runDueOpenpayCharges', () => {
  it('cobra alumnos_activos × precio y marca la factura PAID', async () => {
    subFindMany.mockResolvedValue([dueSub()]);
    studentCount.mockResolvedValue(20);
    charge.mockResolvedValue({ id: 'chg_1', status: 'completed', amount: 1980 });

    const res = await runDueOpenpayCharges(NOW);

    expect(res).toEqual({ charged: 1, failed: 0, skipped: 0 });
    expect(charge).toHaveBeenCalledWith(
      'cust_1',
      expect.objectContaining({ amount: 1980, currency: 'MXN', sourceId: 'card_1' }),
    );
    // factura marcada PAID y suscripción ACTIVE + reloj de gracia limpio.
    expect(invCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 1980, status: 'PENDING' }) }),
    );
    expect(subUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ACTIVE', pastDueSince: null }),
      }),
    );
  });

  it('sin alumnos activos no cobra: factura $0 VOID y avanza el periodo', async () => {
    subFindMany.mockResolvedValue([dueSub()]);
    studentCount.mockResolvedValue(0);

    const res = await runDueOpenpayCharges(NOW);

    expect(charge).not.toHaveBeenCalled();
    expect(res.skipped).toBe(1);
    expect(invCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 0, status: 'VOID' }) }),
    );
  });

  it('cargo fallido: factura FAILED, PAST_DUE y arranca la gracia solo si no venía en mora', async () => {
    subFindMany.mockResolvedValue([dueSub()]);
    studentCount.mockResolvedValue(10);
    charge.mockRejectedValue(new OpenpayError(3001));

    const res = await runDueOpenpayCharges(NOW);

    expect(res).toEqual({ charged: 0, failed: 1, skipped: 0 });
    expect(invUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED' } }),
    );
    // pastDueSince se setea con guard pastDueSince:null (no reinicia en reintentos de dunning).
    expect(subUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { schoolId: 'sch1', pastDueSince: null },
        data: { pastDueSince: NOW },
      }),
    );
    expect(subUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'PAST_DUE' } }),
    );
  });

  it('factura del mes ya PAID: no recobra, solo avanza el reloj', async () => {
    subFindMany.mockResolvedValue([dueSub()]);
    invFindUnique.mockResolvedValue({ id: 'inv_x', status: 'PAID' });

    const res = await runDueOpenpayCharges(NOW);

    expect(charge).not.toHaveBeenCalled();
    expect(res.skipped).toBe(1);
    expect(subUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nextChargeAt: expect.any(Date) }) }),
    );
  });

  it('reintenta una factura FAILED (dunning) reusando el mismo periodo', async () => {
    subFindMany.mockResolvedValue([dueSub()]);
    invFindUnique.mockResolvedValue({ id: 'inv_failed', status: 'FAILED' });
    studentCount.mockResolvedValue(10);
    charge.mockResolvedValue({ id: 'chg_retry', status: 'completed', amount: 990 });

    const res = await runDueOpenpayCharges(NOW);

    expect(res.charged).toBe(1);
    // orderId con sufijo para no repetir el order_id en Openpay.
    expect(charge).toHaveBeenCalledWith(
      'cust_1',
      expect.objectContaining({ orderId: expect.stringContaining('~') }),
    );
  });
});
