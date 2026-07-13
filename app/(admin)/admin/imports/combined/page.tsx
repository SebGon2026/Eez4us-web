import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { CombinedImportDropzone } from '@/components/admin/combined-import-dropzone';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function CombinedImportPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');
  if (!['director', 'super_admin'].includes(session.user.role)) redirect('/admin');
  const t = await getTranslations('invitations');
  const schoolId = session.user.schoolId;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { country: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('combinedImport.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('combinedImport.subtitle')}</p>
      </div>
      <CombinedImportDropzone schoolId={schoolId} country={school?.country} />
    </div>
  );
}
