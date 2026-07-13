import { describe, expect, it } from 'vitest';
import { utils, write } from 'xlsx';

import { normalizePhone, parseParentsExcel } from '@/lib/excel';

function workbook(rows: unknown[][]): Uint8Array {
  const ws = utils.aoa_to_sheet(rows);
  const book = utils.book_new();
  utils.book_append_sheet(book, ws, 'Hoja1');
  return new Uint8Array(write(book, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
}

describe('normalizePhone', () => {
  it('completa el prefijo del país a números nacionales', () => {
    expect(normalizePhone('4433683184', 'MX')).toBe('+524433683184');
    expect(normalizePhone('443-368-3184', 'MX')).toBe('+524433683184');
    expect(normalizePhone('5209095510', 'US')).toBe('+15209095510');
    expect(normalizePhone('71234567', 'SV')).toBe('+50371234567');
  });

  it('respeta números que ya traen el código de país', () => {
    expect(normalizePhone('+52 443 368 3184', 'MX')).toBe('+524433683184');
    expect(normalizePhone('524433683184', 'MX')).toBe('+524433683184');
  });

  it('devuelve undefined cuando no hay forma de armar un número válido', () => {
    expect(normalizePhone('123', 'MX')).toBeUndefined();
    expect(normalizePhone('', 'MX')).toBeUndefined();
    expect(normalizePhone(null, 'MX')).toBeUndefined();
    expect(normalizePhone('+15209095510', 'MX')).toBeUndefined(); // país equivocado
  });
});

describe('parseParentsExcel', () => {
  it('parsea filas válidas y separa IDs de alumnos', () => {
    const buf = workbook([
      ['Nombre', 'Apellido', 'Email', 'Telefono', 'Alumnos'],
      ['Ana', 'García', 'ana@mail.com', '4433683184', 'A1, A2;A3'],
    ]);
    const { parents, errors } = parseParentsExcel(buf, 'MX');
    expect(errors).toHaveLength(0);
    expect(parents).toHaveLength(1);
    expect(parents[0]).toMatchObject({
      firstName: 'Ana',
      lastName: 'García',
      email: 'ana@mail.com',
      phoneE164: '+524433683184',
      studentExternalIds: ['A1', 'A2', 'A3'],
    });
  });

  it('reporta error cuando no hay email ni teléfono válido', () => {
    const buf = workbook([
      ['Nombre', 'Apellido', 'Email', 'Telefono', 'Alumnos'],
      ['Ana', 'García', '', '123', 'A1'],
    ]);
    const { parents, errors } = parseParentsExcel(buf, 'MX');
    expect(parents).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].row).toBe(2);
  });

  it('salta filas totalmente vacías sin marcar error', () => {
    const buf = workbook([
      ['Nombre', 'Apellido', 'Email', 'Telefono', 'Alumnos'],
      ['', '', '', '', ''],
      ['Ana', 'García', 'ana@mail.com', '', 'A1'],
    ]);
    const { parents, errors } = parseParentsExcel(buf, 'MX');
    expect(errors).toHaveLength(0);
    expect(parents).toHaveLength(1);
  });

  it('un email válido no se bloquea por un teléfono inválido', () => {
    const buf = workbook([
      ['Nombre', 'Apellido', 'Email', 'Telefono', 'Alumnos'],
      ['Ana', 'García', 'ana@mail.com', '999', 'A1'],
    ]);
    const { parents, errors } = parseParentsExcel(buf, 'MX');
    expect(errors).toHaveLength(0);
    expect(parents[0].email).toBe('ana@mail.com');
    expect(parents[0].phoneE164).toBeUndefined();
  });
});
