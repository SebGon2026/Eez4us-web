import { read, utils } from 'xlsx';
import { z } from 'zod';

import { normalizePhone } from './excel';

// Importador COMBINADO: una fila = alumno + su padre/madre, para subir el colegio entero
// en un solo archivo. Una fila sin datos de padre crea solo el alumno (queda reportado como
// alumno sin padre invitado). Un padre con varios hijos se repite en la fila de cada hijo;
// el import lo agrupa por email/teléfono en UNA sola invitación.

const studentPartSchema = z.object({
  firstName: z.string().trim().min(1, 'falta el nombre del alumno').max(80),
  lastName: z.string().trim().min(1, 'falta el apellido del alumno').max(80),
  gradeName: z.string().trim().min(1).max(60).optional(),
  externalId: z.string().trim().min(1).max(40).optional(),
});

const parentPartSchema = z.object({
  firstName: z.string().trim().min(1, 'falta el nombre del padre').max(80),
  lastName: z.string().trim().min(1, 'falta el apellido del padre').max(80),
  email: z
    .string()
    .trim()
    .email('email inválido')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phoneE164: z.string().trim().optional(),
});

export type CombinedStudentPart = z.infer<typeof studentPartSchema>;
export type CombinedParentPart = z.infer<typeof parentPartSchema>;

export interface CombinedRow {
  student: CombinedStudentPart;
  parent?: CombinedParentPart;
}

export interface ParseCombinedExcelResult {
  rows: CombinedRow[];
  errors: { row: number; message: string }[];
}

type FieldKey =
  | 'studentFirstName'
  | 'studentLastName'
  | 'gradeName'
  | 'externalId'
  | 'parentFirstName'
  | 'parentLastName'
  | 'email'
  | 'phone';

const HEADER_MAP: Record<string, FieldKey> = {
  alumnonombre: 'studentFirstName',
  nombrealumno: 'studentFirstName',
  nombredelalumno: 'studentFirstName',
  studentfirstname: 'studentFirstName',
  alumnoapellido: 'studentLastName',
  apellidoalumno: 'studentLastName',
  apellidodelalumno: 'studentLastName',
  studentlastname: 'studentLastName',
  grado: 'gradeName',
  grade: 'gradeName',
  nivel: 'gradeName',
  matricula: 'externalId',
  matriculaalumno: 'externalId',
  externalid: 'externalId',
  idalumno: 'externalId',
  studentid: 'externalId',
  id: 'externalId',
  padrenombre: 'parentFirstName',
  nombrepadre: 'parentFirstName',
  nombredelpadre: 'parentFirstName',
  parentfirstname: 'parentFirstName',
  padreapellido: 'parentLastName',
  apellidopadre: 'parentLastName',
  apellidodelpadre: 'parentLastName',
  parentlastname: 'parentLastName',
  email: 'email',
  correo: 'email',
  correoelectronico: 'email',
  emailpadre: 'email',
  correopadre: 'email',
  whatsapp: 'phone',
  telefono: 'phone',
  phone: 'phone',
  celular: 'phone',
  whatsapppadre: 'phone',
  telefonopadre: 'phone',
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

function toStr(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

function emptyToUndef(v: unknown): string | undefined {
  const s = toStr(v);
  return s === '' ? undefined : s;
}

// `country` valida/completa el teléfono al prefijo del país de la escuela (igual que el
// importador de padres: un número nacional sin "+" se completa solo).
export function parseCombinedExcel(
  buffer: ArrayBuffer | Uint8Array,
  country?: string | null,
): ParseCombinedExcelResult {
  // raw: true evita coacción en CSV ("+52..." perdería el "+", matrículas con ceros a la izquierda).
  const wb = read(buffer, { type: 'array', raw: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: [{ row: 0, message: 'Archivo sin hojas' }] };
  }
  const sheet = wb.Sheets[sheetName];
  const rawRows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const rows: CombinedRow[] = [];
  const errors: { row: number; message: string }[] = [];

  rawRows.forEach((raw, idx) => {
    const normalized: Partial<Record<FieldKey, unknown>> = {};
    for (const [key, value] of Object.entries(raw)) {
      const mapped = HEADER_MAP[normalizeHeader(key)];
      if (mapped) normalized[mapped] = value;
    }

    const sFirst = toStr(normalized.studentFirstName);
    const sLast = toStr(normalized.studentLastName);
    const pFirst = toStr(normalized.parentFirstName);
    const pLast = toStr(normalized.parentLastName);
    const email = toStr(normalized.email);
    const phoneRaw = toStr(normalized.phone);

    // Fila totalmente vacía (relleno típico de Excel): se salta en silencio.
    if (!sFirst && !sLast && !pFirst && !pLast && !email && !phoneRaw) return;

    const studentParsed = studentPartSchema.safeParse({
      firstName: sFirst,
      lastName: sLast,
      gradeName: emptyToUndef(normalized.gradeName),
      externalId: emptyToUndef(normalized.externalId),
    });
    if (!studentParsed.success) {
      errors.push({
        row: idx + 2,
        message: studentParsed.error.issues.map((i) => i.message).join('; '),
      });
      return;
    }

    const hasParentData = Boolean(pFirst || pLast || email || phoneRaw);
    if (!hasParentData) {
      rows.push({ student: studentParsed.data });
      return;
    }

    const phoneE164 = normalizePhone(phoneRaw, country);
    const parentParsed = parentPartSchema.safeParse({
      firstName: pFirst,
      lastName: pLast,
      email: email || undefined,
      phoneE164,
    });
    if (!parentParsed.success) {
      errors.push({
        row: idx + 2,
        message: parentParsed.error.issues.map((i) => i.message).join('; '),
      });
      return;
    }
    if (!parentParsed.data.email && !parentParsed.data.phoneE164) {
      errors.push({
        row: idx + 2,
        message: phoneRaw
          ? 'sin email y el whatsapp no es válido para el país de la escuela'
          : 'falta email o whatsapp del padre',
      });
      return;
    }

    rows.push({ student: studentParsed.data, parent: parentParsed.data });
  });

  return { rows, errors };
}
