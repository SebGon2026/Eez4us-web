import { jsonError, requireSession } from '@/lib/session';

// Placeholder: las preferencias por usuario se persistirían en una tabla
// `NotificationPreference` cuando tengamos UI mobile. Por ahora devolvemos
// defaults y aceptamos PUT como no-op para que el cliente no falle.

const DEFAULTS = {
  pushArrival: true,
  pushMessages: true,
  pushReminders: true,
  pushAlerts: true,
  emailMonthlySummary: true,
};

export async function GET(req: Request): Promise<Response> {
  try {
    await requireSession(req);
    return Response.json({ preferences: DEFAULTS });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: Request): Promise<Response> {
  try {
    await requireSession(req);
    const body = (await req.json()) as Record<string, unknown>;
    return Response.json({ preferences: { ...DEFAULTS, ...body } });
  } catch (err) {
    return jsonError(err);
  }
}
