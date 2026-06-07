import { z } from 'zod';

import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

const schema = z.object({
  type: z.enum(['BUG', 'IMPROVEMENT', 'SUPPORT']),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(2000),
});

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await requireSession(req);
    const tickets = await prisma.supportTicket.findMany({
      where: { reportedById: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return Response.json({ tickets });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await requireSession(req);
    const body = schema.parse(await req.json());
    const ticket = await prisma.supportTicket.create({
      data: {
        reportedById: session.user.id,
        schoolId: session.user.schoolId,
        type: body.type,
        title: body.title,
        description: body.description,
      },
    });
    return Response.json({ ticket }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
