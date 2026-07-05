import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { NewVendorForm } from '@/components/admin/new-vendor-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export default async function NewVendorPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/admin');

  const candidateUsers = await prisma.user.findMany({
    where: {
      role: 'vendor',
      vendor: null,
    },
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const t = await getTranslations('schools');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{t('vendors.create')}</h1>
        <p className="text-sm text-muted-foreground">{t('vendors.newSubtitle')}</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t('vendors.newDataTitle')}</CardTitle>
          <CardDescription>{t('vendors.defaultCommissionHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <NewVendorForm candidateUsers={candidateUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
