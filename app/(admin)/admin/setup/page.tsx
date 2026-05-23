import { redirect } from 'next/navigation';

import { SetupWizard } from '@/components/admin/setup-wizard';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function SetupPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  const schoolId = session.user.schoolId;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      internalCode: true,
      addressText: true,
      addressLat: true,
      addressLng: true,
      _count: { select: { pickupPoints: { where: { active: true } } } },
    },
  });
  if (!school) redirect('/login');
  if (school._count.pickupPoints > 0) redirect('/admin');

  return (
    <SetupWizard
      schoolId={schoolId}
      initial={{
        name: school.name,
        internalCode: school.internalCode,
        addressText: school.addressText ?? '',
        addressLat: school.addressLat,
        addressLng: school.addressLng,
      }}
    />
  );
}
