import { read, utils } from 'xlsx';
import { z } from 'zod';

import { dialPrefixForCountry, validatePhoneForCountry } from './phone';

const parentRowSchema = z.object({
  firstName: z.string().trim().min(1, 'falta el nombre del padre'),
  lastName: z.string().trim().min(1, 'falta el apellido del padre'),
  email: z
    .string()
    .trim()
    .email('email inválido')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  // El teléfono se normaliza/valida aparte (normalizePhone): acá va suelto para no tumbar
  // toda la fila por un formato raro cuando hay email válido.
  phoneE164: z.string().trim().optional(),
  studentExternalIds: z.array(z.string().trim().min(1)).min(1, 'falta el ID del alumno'),
});

export type ParentRow = z.infer<typeof parentRowSchema>;

export interface ParseParentsExcelResult {
  parents: ParentRow[];
  errors: { row: number; message: string }[];
}

const HEADER_MAP: Record<string, keyof ParentRow | 'studentExternalIdsRaw'> = {
  firstname: 'firstName',
  nombre: 'firstName',
  nombres: 'firstName',
  padrenombre: 'firstName',
  nombrepadre: 'firstName',
  lastname: 'lastName',
  apellido: 'lastName',
  apellidos: 'lastName',
  padreapellido: 'lastName',
  apellidopadre: 'lastName',
  email: 'email',
  correo: 'email',
  'correo electronico': 'email',
  phone: 'phoneE164',
  phonee164: 'phoneE164',
  telefono: 'phoneE164',
  whatsapp: 'phoneE164',
  studentexternalids: 'studentExternalIdsRaw',
  alumnos: 'studentExternalIdsRaw',
  idsalumnos: 'studentExternalIdsRaw',
  idsalumno: 'studentExternalIdsRaw',
  idalumno: 'studentExternalIdsRaw',
  matriculas: 'studentExternalIdsRaw',
  matricula: 'studentExternalIdsRaw',
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

function splitIds(raw: unknown): string[] {
  if (raw === null || raw === undefined) return [];
  return String(raw)
    .split(/[,;|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toStr(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

// Normaliza un teléfono a E.164 válido para el país de la escuela, o devuelve undefined si
// no se puede. Es tolerante: acepta números sin "+" (los completa con el prefijo del país,
// ej. MX "4433683184" → "+524433683184") para no exigirle al director que sepa E.164.
export function normalizePhone(raw: unknown, country?: string | null): string | undefined {
  const s = toStr(raw);
  if (!s) return undefined;
  if (s.startsWith('+')) {
    const compact = '+' + s.slice(1).replace(/\D/g, '');
    return validatePhoneForCountry(compact, country).valid ? compact : undefined;
  }
  const digits = s.replace(/\D/g, '');
  if (!digits) return undefined;
  const prefix = dialPrefixForCountry(country); // "+52" | "+1" | null
  if (prefix) {
    const dial = prefix.slice(1);
    // Ya trae el código de país sin el "+".
    if (digits.startsWith(dial) && validatePhoneForCountry('+' + digits, country).valid) {
      return '+' + digits;
    }
    // Número nacional: anteponer el prefijo del país.
    const national = prefix + digits;
    if (validatePhoneForCountry(national, country).valid) return national;
  }
  // País desconocido o no encajó: E.164 genérico con "+".
  const generic = '+' + digits;
  return /^\+[1-9]\d{6,14}$/.test(generic) ? generic : undefined;
}

// `country` (ISO o nombre legible de la escuela) endurece la validación de teléfono al
// prefijo+longitud de ese país. Omitirlo cae a E.164 genérico (compat hacia atrás).
export function parseParentsExcel(
  buffer: ArrayBuffer | Uint8Array,
  country?: string | null,
): ParseParentsExcelResult {
  // raw: true evita que SheetJS coaccione en CSV (ej. "+52..." → número perdiendo el "+",
  // o matrículas con ceros a la izquierda). En xlsx es inocuo (celdas ya vienen tipadas).
  const wb = read(buffer, { type: 'array', raw: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { parents: [], errors: [{ row: 0, message: 'Excel sin hojas' }] };
  }
  const sheet = wb.Sheets[sheetName];
  const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const parents: ParentRow[] = [];
  const errors: { row: number; message: string }[] = [];

  rows.forEach((row, idx) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const mapped = HEADER_MAP[normalizeHeader(key)];
      if (mapped) normalized[mapped] = value;
    }

    const firstName = toStr(normalized.firstName);
    const lastName = toStr(normalized.lastName);
    const email = toStr(normalized.email);
    const phoneRaw = toStr(normalized.phoneE164);
    const studentExternalIds = splitIds(normalized.studentExternalIdsRaw);

    // Fila sin ningún dato de padre: típico de la plantilla precargada (el alumno está
    // cargado pero el director todavía no le puso padre). Se salta en silencio; el reporte
    // de cobertura del importador avisa qué alumnos quedaron sin padre.
    if (!firstName && !lastName && !email && !phoneRaw) return;

    // El teléfono se autocompleta/valida contra el país; el email tiene prioridad como canal.
    const phoneE164 = normalizePhone(phoneRaw, country);

    const parsed = parentRowSchema.safeParse({
      firstName,
      lastName,
      email: email || undefined,
      phoneE164,
      studentExternalIds,
    });
    if (!parsed.success) {
      errors.push({
        row: idx + 2,
        message: parsed.error.issues.map((i) => i.message).join('; '),
      });
      return;
    }
    if (!parsed.data.email && !parsed.data.phoneE164) {
      // Tiene nombre pero ni email ni un teléfono válido → no hay a quién invitar.
      errors.push({
        row: idx + 2,
        message: phoneRaw
          ? 'sin email y el teléfono no es válido para el país de la escuela'
          : 'falta email o teléfono del padre',
      });
      return;
    }
    parents.push(parsed.data);
  });

  return { parents, errors };
}
