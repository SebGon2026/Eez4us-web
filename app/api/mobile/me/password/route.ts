import { z } from 'zod';

import { auth } from '@/lib/auth';
import { jsonError, requireSession } from '@/lib/session';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function PUT(req: Request): Promise<Response> {
  try {
    await requireSession(req);
    const body = schema.parse(await req.json());
    const res = await auth.api.changePassword({
      headers: req.headers,
      body: {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      },
    });
    return Response.json({ ok: true, result: res ? true : false });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    return jsonError(err);
  }
}
