import { redirect } from 'next/navigation';

import { NewVendorForm } from '@/components/admin/new-vendor-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/db';
import { getCurrentSession } from '@/lib/session';

export const runtime = 'edge';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Crear vendor</h1>
        <p className="text-sm text-muted-foreground">
          Elegí un usuario existente con rol vendor o creá uno nuevo.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Datos del vendor</CardTitle>
          <CardDescription>Comisión por defecto 10%.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewVendorForm candidateUsers={candidateUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
