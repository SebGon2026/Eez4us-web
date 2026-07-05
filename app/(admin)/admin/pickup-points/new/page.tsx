import { PickupPointForm } from '@/components/admin/pickup-point-form';
import { prisma } from '@/lib/db';
import { requireSchoolPage } from '@/lib/session';

const DEFAULT_LAT = 19.4326;
const DEFAULT_LNG = -99.1332;

export default async function NewPickupPointPage() {
  const { schoolId } = await requireSchoolPage();

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { addressLat: true, addressLng: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Nuevo punto de recogida</h1>
        <p className="text-sm text-muted-foreground">
          Arrastrá el marker para reubicar el centro.
        </p>
      </div>
      <PickupPointForm
        schoolId={schoolId}
        initial={{
          name: '',
          centerLat: school?.addressLat ?? DEFAULT_LAT,
          centerLng: school?.addressLng ?? DEFAULT_LNG,
          radiusMeters: 150,
        }}
      />
    </div>
  );
}
