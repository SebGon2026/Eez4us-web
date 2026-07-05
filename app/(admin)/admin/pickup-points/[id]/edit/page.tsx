import { notFound } from 'next/navigation';

import { PickupPointForm } from '@/components/admin/pickup-point-form';
import { prisma } from '@/lib/db';
import { requireSchoolPage } from '@/lib/session';

export default async function EditPickupPointPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { schoolId } = await requireSchoolPage();
  const { id } = await params;

  const pp = await prisma.pickupPoint.findUnique({
    where: { id },
    select: {
      id: true,
      schoolId: true,
      name: true,
      centerLat: true,
      centerLng: true,
      radiusMeters: true,
    },
  });
  if (!pp || pp.schoolId !== schoolId) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Editar punto</h1>
        <p className="text-sm text-muted-foreground">{pp.name}</p>
      </div>
      <PickupPointForm
        schoolId={schoolId}
        pickupPointId={pp.id}
        initial={{
          name: pp.name,
          centerLat: pp.centerLat,
          centerLng: pp.centerLng,
          radiusMeters: pp.radiusMeters,
        }}
      />
    </div>
  );
}
