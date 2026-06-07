import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentSession } from '@/lib/session';

import { NewSchoolForm } from './new-school-form';

export default async function NewSchoolPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Alta de colegio</h1>
        <p className="text-sm text-muted-foreground">
          Crear colegio + director inicial. El director recibirá credenciales por email
          (placeholder en dev).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Datos del colegio</CardTitle>
        </CardHeader>
        <CardContent>
          <NewSchoolForm />
        </CardContent>
      </Card>
    </div>
  );
}
