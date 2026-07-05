import { StudentForm } from '@/components/admin/student-form';
import { prisma } from '@/lib/db';
import { requireSchoolPage } from '@/lib/session';

export default async function NewStudentPage() {
  const { schoolId } = await requireSchoolPage();

  const grades = await prisma.grade.findMany({
    where: { schoolId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Nuevo alumno</h1>
        <p className="text-sm text-muted-foreground">Solo nombre y apellido son obligatorios.</p>
      </div>
      <StudentForm
        schoolId={schoolId}
        grades={grades}
        initial={{
          firstName: '',
          lastName: '',
          gradeId: null,
          externalId: null,
          birthDate: null,
          pickupMode: 'PRIVATE_VEHICLE',
          transportName: null,
          transportPlate: null,
          transportPhone: null,
          transportVehicleType: null,
        }}
      />
    </div>
  );
}
