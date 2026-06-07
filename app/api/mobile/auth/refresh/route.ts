import { auth } from '@/lib/auth';
import { jsonError, requireSession } from '@/lib/session';

export async function POST(req: Request): Promise<Response> {
  try {
    await requireSession(req);
    const tokenRes = await auth.api.getToken({ headers: req.headers });
    return Response.json({ jwt: (tokenRes as { token?: string } | null)?.token ?? null });
  } catch (err) {
    return jsonError(err);
  }
}
