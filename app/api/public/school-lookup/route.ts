import { prisma } from '@/lib/db';

// Endpoint PÚBLICO (sin auth). No expone nada sensible: solo nombre, logo
// y tonalidad de marca del colegio asociado al código. Si el código no
// matchea, devuelve 404 sin más detalle (para no permitir enumeración).
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = (url.searchParams.get('code') ?? '').trim().toUpperCase();
  if (!code || code.length < 3 || code.length > 64) {
    return Response.json({ error: 'INVALID_CODE' }, { status: 400 });
  }
  const school = await prisma.school.findUnique({
    where: { internalCode: code },
    select: {
      id: true,
      name: true,
      internalCode: true,
      logoUrl: true,
      brandHue: true,
      active: true,
    },
  });
  if (!school || !school.active) {
    return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  return Response.json({ school });
}
