import { getSchoolReadiness } from '@/lib/onboarding';
import { jsonError, requireSchool } from '@/lib/session';

// GET /api/schools/{id}/readiness -> estado de alta de la escuela (≥1 punto + ≥1 alumno +
// ≥1 padre invitado). Lo consume el wizard de onboarding y el home del director.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id: schoolId } = await params;
    await requireSchool(req, schoolId, ['director', 'super_admin']);
    const readiness = await getSchoolReadiness(schoolId);
    return Response.json(readiness);
  } catch (err) {
    return jsonError(err);
  }
}
