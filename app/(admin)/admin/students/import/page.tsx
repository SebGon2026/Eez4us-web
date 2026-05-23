import { redirect } from 'next/navigation';

import { ExcelDropzone } from '@/components/admin/excel-dropzone';
import { getCurrentSession } from '@/lib/session';

export default async function ImportStudentsPage() {
  const session = await getCurrentSession();
  if (!session || !session.user.schoolId) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Importar padres</h1>
        <p className="text-sm text-muted-foreground">
          Subí un Excel con padres y los IDs de sus alumnos. Generamos una invitación por padre
          (email si tiene, sino WhatsApp).
        </p>
      </div>
      <ExcelDropzone schoolId={session.user.schoolId} />
    </div>
  );
}
