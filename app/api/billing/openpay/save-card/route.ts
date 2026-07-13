import { z } from 'zod';

import { openpayPricePerStudentMXN, resolveProvider } from '@/lib/billing';
import { prisma } from '@/lib/db';
import { createCardFromToken, createCustomer } from '@/lib/openpay';
import { jsonError, requireRole } from '@/lib/session';

const ALLOWED_ROLES = ['director', 'super_admin'];

// tokenId + deviceSessionId los genera Openpay.js en el navegador del director (PCI SAQ-A).
const bodySchema = z.object({
  tokenId: z.string().min(1),
  deviceSessionId: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ALLOWED_ROLES);
    const schoolId = session.user.schoolId;
    if (!schoolId) return Response.json({ error: 'NO_SCHOOL' }, { status: 400 });

    const body = bodySchema.parse(await req.json());

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        country: true,
        currency: true,
        openpayCustomerId: true,
        users: {
          where: { role: 'director' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { email: true },
        },
      },
    });
    if (!school) return Response.json({ error: 'SCHOOL_NOT_FOUND' }, { status: 404 });
    if (resolveProvider(school) !== 'openpay') {
      return Response.json({ error: 'PROVIDER_MISMATCH' }, { status: 400 });
    }

    let customerId = school.openpayCustomerId;
    if (!customerId) {
      const customer = await createCustomer({
        name: school.name,
        email: school.users[0]?.email ?? `billing+${school.id}@eez4us.com`,
      });
      customerId = customer.id;
      await prisma.school.update({
        where: { id: schoolId },
        data: { openpayCustomerId: customerId },
      });
    }

    const card = await createCardFromToken(customerId, {
      tokenId: body.tokenId,
      deviceSessionId: body.deviceSessionId,
    });

    // El reloj de cobro respeta lo que sea más tarde: hoy, el trial vigente o un ciclo ya
    // cobrado. Guardar tarjeta durante el trial NO adelanta el primer cargo; en mora
    // (PAST_DUE) queda en `now` y el próximo cron cobra.
    const existing = await prisma.subscription.findUnique({
      where: { schoolId },
      select: { status: true, trialEndsAt: true, currentPeriodEnd: true, nextChargeAt: true },
    });
    const now = new Date();
    const trialEnd =
      existing?.trialEndsAt ??
      (existing?.status === 'TRIALING' ? existing.currentPeriodEnd : null);
    const candidates = [now.getTime()];
    if (trialEnd && trialEnd > now) candidates.push(trialEnd.getTime());
    if (existing?.nextChargeAt && existing.nextChargeAt > now) {
      candidates.push(existing.nextChargeAt.getTime());
    }
    const nextChargeAt = new Date(Math.max(...candidates));

    // status ACTIVE aunque queden días de trial: el barrido del cron solo cobra
    // ACTIVE/PAST_DUE y el trial ya quedó protegido por nextChargeAt.
    await prisma.subscription.upsert({
      where: { schoolId },
      create: {
        schoolId,
        provider: 'openpay',
        status: 'ACTIVE',
        pricePerStudent: openpayPricePerStudentMXN(),
        currency: 'MXN',
        openpayCardId: card.id,
        openpayDeviceSessionId: body.deviceSessionId,
        nextChargeAt,
      },
      update: {
        provider: 'openpay',
        status: 'ACTIVE',
        pricePerStudent: openpayPricePerStudentMXN(),
        currency: 'MXN',
        openpayCardId: card.id,
        openpayDeviceSessionId: body.deviceSessionId,
        nextChargeAt,
        // Cargar/actualizar tarjeta saca la mora: el próximo cron cobrará y el reloj de
        // gracia se reinicia (si el cobro vuelve a fallar, pastDueSince arranca de nuevo).
        pastDueSince: null,
      },
    });

    const masked = card.card_number ?? '';
    return Response.json({ ok: true, cardLast4: masked ? masked.slice(-4) : null });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY', issues: err.issues }, { status: 400 });
    }
    return jsonError(err);
  }
}
