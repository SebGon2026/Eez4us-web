import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireSession(req);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        schoolId: true,
        phoneE164: true,
        emailVerified: true,
        school: { select: { id: true, name: true, addressText: true } },
      },
    });
    return Response.json({ user });
  } catch (err) {
    return jsonError(err);
  }
}
