import { read, utils } from 'xlsx';
import { z } from 'zod';

// Importador de ROSTER de alumnos (distinto del de padres/invitaciones en lib/excel.ts).
// El director sube nombre, apellido, grado (texto — se matchea por nombre) y matrícula.
// La matrícula (externalId) es la que después referencia el Excel de padres por su ID.

const studentRowSchema = z.object({
  firstName: z.string().trim().min(1, 'nombre requerido').max(80),
  lastName: z.string().trim().min(1, 'apellido requerido').max(80),
  gradeName: z.string().trim().min(1).max(60).optional(),
  externalId: z.string().trim().min(1).max(40).optional(),
  birthDate: z.string().trim().optional(),
});

export type StudentRow = z.infer<typeof studentRowSchema>;

export interface ParseStudentsExcelResult {
  students: StudentRow[];
  errors: { row: number; message: string }[];
}

const HEADER_MAP: Record<string, keyof StudentRow> = {
  firstname: 'firstName',
  nombre: 'firstName',
  nombres: 'firstName',
  lastname: 'lastName',
  apellido: 'lastName',
  apellidos: 'lastName',
  grade: 'gradeName',
  grado: 'gradeName',
  nivel: 'gradeName',
  matricula: 'externalId',
  id: 'externalId',
  externalid: 'externalId',
  idalumno: 'externalId',
  studentid: 'externalId',
  birthdate: 'birthDate',
  nacimiento: 'birthDate',
  fechanacimiento: 'birthDate',
  dob: 'birthDate',
};

function normalizeHeader(h: string): string {
  return h
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

// Celda vacía (defval '' de sheet_to_json) → undefined, para que los campos opcionales
// queden ausentes de verdad (el `?? placeholder` del preview y los `if (x)` del import
// dependen de undefined, no de '').
function emptyToUndef(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

// Fecha de nacimiento: acepta Date (xlsx con cellDates) o string ISO/parseable.
// Es opcional y best-effort: si no se puede parsear se ignora (no rompe la fila).
function normalizeBirthDate(raw: unknown): string | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw.toISOString();
  const parsed = new Date(String(raw));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function parseStudentsExcel(buffer: ArrayBuffer | Uint8Array): ParseStudentsExcelResult {
  // raw: true evita coacción en CSV (matrículas con ceros a la izquierda, etc.). cellDates
  // convierte fechas de xlsx a Date; en CSV la fecha llega como texto y la normaliza el schema.
  const wb = read(buffer, { type: 'array', raw: true, cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { students: [], errors: [{ row: 0, message: 'Archivo sin hojas' }] };
  }
  const sheet = wb.Sheets[sheetName];
  const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const students: StudentRow[] = [];
  const errors: { row: number; message: string }[] = [];

  rows.forEach((row, idx) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const mapped = HEADER_MAP[normalizeHeader(key)];
      if (mapped) normalized[mapped] = value;
    }

    const candidate = {
      firstName: emptyToUndef(normalized.firstName),
      lastName: emptyToUndef(normalized.lastName),
      gradeName: emptyToUndef(normalized.gradeName),
      externalId: emptyToUndef(normalized.externalId),
      birthDate: normalizeBirthDate(normalized.birthDate),
    };

    const parsed = studentRowSchema.safeParse(candidate);
    if (!parsed.success) {
      errors.push({
        row: idx + 2,
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }
    students.push(parsed.data);
  });

  return { students, errors };
}
