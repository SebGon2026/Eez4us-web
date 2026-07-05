import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { PickupPointForm } from '@/components/admin/pickup-point-form';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

const DEFAULT_LAT = 19.4326;
const DEFAULT_LNG = -99.1332;

export default async function NewPickupPointPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  const schoolId = session.user.schoolId;
  const t = await getTranslations('pickupPoints');

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { addressLat: true, addressLng: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('new.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('new.subtitle')}</p>
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
