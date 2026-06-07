import { z } from 'zod';

import { prisma } from '@/lib/db';
import { jsonError, requireSession } from '@/lib/session';

const schema = z.object({
  expoPushToken: z.string().min(8).max(200),
  platform: z.enum(['ios', 'android']),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await requireSession(req);
    const body = schema.parse(await req.json());
    const token = await prisma.pushToken.upsert({
      where: { expoPushToken: body.expoPushToken },
      update: { userId: session.user.id, platform: body.platform, lastSeenAt: new Date() },
      create: {
        userId: session.user.id,
        expoPushToken: body.expoPushToken,
        platform: body.platform,
      },
    });
    return Response.json({ token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
