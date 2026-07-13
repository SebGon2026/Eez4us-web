import { describe, expect, it } from 'vitest';
import { utils, write } from 'xlsx';

import { parseCombinedExcel } from '@/lib/combined-excel';

function workbook(rows: unknown[][]): Uint8Array {
  const ws = utils.aoa_to_sheet(rows);
  const book = utils.book_new();
  utils.book_append_sheet(book, ws, 'Hoja1');
  return new Uint8Array(write(book, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
}

const HEADERS = [
  'Alumno Nombre',
  'Alumno Apellido',
  'Grado',
  'Matrícula',
  'Padre Nombre',
  'Padre Apellido',
  'Email',
  'WhatsApp',
];

describe('parseCombinedExcel', () => {
  it('parsea alumno + padre en una fila', () => {
    const buf = workbook([
      HEADERS,
      ['Luis', 'Pérez', '3A', 'M-01', 'Carla', 'Pérez', 'carla@mail.com', '4433683184'],
    ]);
    const { rows, errors } = parseCombinedExcel(buf, 'MX');
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].student).toMatchObject({
      firstName: 'Luis',
      lastName: 'Pérez',
      gradeName: '3A',
      externalId: 'M-01',
    });
    expect(rows[0].parent).toMatchObject({
      firstName: 'Carla',
      lastName: 'Pérez',
      email: 'carla@mail.com',
      phoneE164: '+524433683184',
    });
  });

  it('fila sin datos de padre crea solo el alumno', () => {
    const buf = workbook([HEADERS, ['Luis', 'Pérez', '', '', '', '', '', '']]);
    const { rows, errors } = parseCombinedExcel(buf, 'MX');
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].parent).toBeUndefined();
  });

  it('fila sin nombre de alumno es error aunque tenga padre', () => {
    const buf = workbook([HEADERS, ['', '', '', '', 'Carla', 'Pérez', 'carla@mail.com', '']]);
    const { rows, errors } = parseCombinedExcel(buf, 'MX');
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].row).toBe(2);
  });

  it('padre sin email y con whatsapp inválido para el país es error', () => {
    const buf = workbook([HEADERS, ['Luis', 'Pérez', '', '', 'Carla', 'Pérez', '', '123']]);
    const { rows, errors } = parseCombinedExcel(buf, 'MX');
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it('filas totalmente vacías se saltan en silencio', () => {
    const buf = workbook([
      HEADERS,
      ['', '', '', '', '', '', '', ''],
      ['Luis', 'Pérez', '', '', '', '', '', ''],
    ]);
    const { rows, errors } = parseCombinedExcel(buf, 'MX');
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
  });

  it('acepta encabezados en inglés', () => {
    const buf = workbook([
      ['studentFirstName', 'studentLastName', 'grade', 'studentId', 'parentFirstName', 'parentLastName', 'email', 'phone'],
      ['Amy', 'Stone', 'K', 'S-9', 'Beth', 'Stone', 'beth@mail.com', '5209095510'],
    ]);
    const { rows, errors } = parseCombinedExcel(buf, 'US');
    expect(errors).toHaveLength(0);
    expect(rows[0].parent?.phoneE164).toBe('+15209095510');
  });
});
