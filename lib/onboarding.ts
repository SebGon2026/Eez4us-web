import { prisma } from './db';

// "Escuela lista" para el piloto: el mínimo operable. El portón necesita al menos un punto
// de recogida, un alumno y un padre invitado para que el loop end-to-end funcione. Los grados
// van ANTES que los alumnos: el alumno se asigna a un grado ya configurado (obs. del cliente).
// El staff de portón (logistics/support_staff) es recomendado pero NO bloquea: el director
// puede operar la TV. Centralizado acá para que home, el endpoint y el wizard usen el mismo
// criterio.

export type ReadinessStepKey = 'pickup' | 'grades' | 'students' | 'parents' | 'staff';

export interface ReadinessStep {
  key: ReadinessStepKey;
  done: boolean;
  count: number;
  required: boolean;
}

export interface SchoolReadiness {
  pickupPointsCount: number;
  gradesCount: number;
  studentsCount: number;
  invitedParentsCount: number;
  staffCount: number;
  isReady: boolean;
  steps: ReadinessStep[];
}

export async function getSchoolReadiness(schoolId: string): Promise<SchoolReadiness> {
  const [pickupPointsCount, gradesCount, studentsCount, invitedParentsCount, staffCount] =
    await Promise.all([
      prisma.pickupPoint.count({ where: { schoolId, active: true } }),
      prisma.grade.count({ where: { schoolId } }),
      prisma.student.count({ where: { schoolId, active: true } }),
      prisma.invitation.count({
        where: { schoolId, status: { in: ['PENDING', 'SENT', 'CLAIMED'] } },
      }),
      prisma.user.count({ where: { schoolId, role: { in: ['support_staff', 'logistics'] } } }),
    ]);

  const steps: ReadinessStep[] = [
    { key: 'pickup', done: pickupPointsCount >= 1, count: pickupPointsCount, required: true },
    { key: 'grades', done: gradesCount >= 1, count: gradesCount, required: true },
    { key: 'students', done: studentsCount >= 1, count: studentsCount, required: true },
    { key: 'parents', done: invitedParentsCount >= 1, count: invitedParentsCount, required: true },
    { key: 'staff', done: staffCount >= 1, count: staffCount, required: false },
  ];

  const isReady = steps.filter((s) => s.required).every((s) => s.done);
  return {
    pickupPointsCount,
    gradesCount,
    studentsCount,
    invitedParentsCount,
    staffCount,
    isReady,
    steps,
  };
}
