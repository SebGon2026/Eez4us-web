import { resolveProvider } from '@/lib/billing';
import { prisma } from '@/lib/db';
import { jsonError, requireRole } from '@/lib/session';
import { createCustomerPortalLink, readPortalReturnUrl } from '@/lib/stripe';

const ALLOWED_ROLES = ['director', 'super_admin'];

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await requireRole(req, ALLOWED_ROLES);
    const schoolId = session.user.schoolId;
    if (!schoolId) {
      return Response.json({ error: 'NO_SCHOOL' }, { status: 400 });
    }
    // Openpay no tiene portal hosteado: las escuelas MX gestionan la tarjeta en el panel propio.
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { country: true, currency: true },
    });
    if (school && resolveProvider(school) === 'openpay') {
      return Response.json({ error: 'OPENPAY_PROVIDER' }, { status: 400 });
    }
    const url = await createCustomerPortalLink(schoolId, readPortalReturnUrl());
    return Response.json({ url });
  } catch (err) {
    return jsonError(err);
  }
}
