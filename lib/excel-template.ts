import { utils, write } from 'xlsx';

// Generación de plantillas descargables en el navegador (obs. del cliente: proveer
// plantilla de alumnos y de padres, en xlsx y csv, con columnas y filas de ejemplo).
// Es 100% client-side: solo se importa desde componentes 'use client'.

export type TemplateFormat = 'xlsx' | 'csv';

type Cell = string | number;

function downloadWorkbook(rows: Cell[][], baseName: string, format: TemplateFormat): void {
  const ws = utils.aoa_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Plantilla');

  let blob: Blob;
  if (format === 'xlsx') {
    const out = write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    blob = new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  } else {
    const csv = write(wb, { type: 'string', bookType: 'csv' }) as string;
    // BOM para que Excel abra los acentos correctamente.
    blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Filas de ejemplo. Las matrículas de alumnos coinciden con los ids_alumnos del template
// de padres, para que el ejemplo sea coherente entre ambos archivos.
export const STUDENT_TEMPLATE_HEADERS = ['nombre', 'apellido', 'grado', 'matricula', 'nacimiento'];
export const STUDENT_TEMPLATE_SAMPLE: Cell[][] = [
  ['Sofía', 'Martínez', 'Primero A', '7047', '2016-03-12'],
  ['Ana', 'Rodríguez', 'Primero A', '8585', '2016-07-02'],
  ['Valentina', 'Rodríguez', 'Segundo B', '7913', '2015-11-20'],
  ['Mateo', 'González', 'Segundo B', '8226', '2015-05-09'],
  ['Diego', 'García', 'Tercero A', '5592', '2014-09-30'],
];

export const PARENT_TEMPLATE_HEADERS = ['nombre', 'apellido', 'email', 'whatsapp', 'ids_alumnos'];

// Los teléfonos de ejemplo usan el prefijo de marcación del país de la escuela (dialPrefix,
// ej. +52 MX / +1 US) + 10 dígitos nacionales, para que validen contra validatePhoneForCountry
// (MX admite 10-11 nacionales, US exige 10). Así la plantilla descargada sube limpia tal cual
// en su país — no hardcodeamos +52 (rompería en una escuela de EE.UU.).
export function parentTemplateSample(dialPrefix: string): Cell[][] {
  return [
    ['Sofía', 'Martínez', 'sofia.martinez@example.com', `${dialPrefix}5512345601`, '7047'],
    ['Ana', 'Rodríguez', 'ana.rodriguez@example.com', `${dialPrefix}5512345602`, '8585'],
    ['Valentina', 'Rodríguez', 'valentina.rodriguez@example.com', `${dialPrefix}5512345603`, '7913;8226'],
    ['Mateo', 'González', 'mateo.gonzalez@example.com', `${dialPrefix}5512345604`, '8226'],
    ['Diego', 'García', '', `${dialPrefix}5512345605`, '5592'],
  ];
}

export function downloadStudentTemplate(format: TemplateFormat): void {
  downloadWorkbook([STUDENT_TEMPLATE_HEADERS, ...STUDENT_TEMPLATE_SAMPLE], 'plantilla-alumnos', format);
}

export function downloadParentTemplate(format: TemplateFormat, dialPrefix: string): void {
  downloadWorkbook(
    [PARENT_TEMPLATE_HEADERS, ...parentTemplateSample(dialPrefix)],
    'plantilla-padres',
    format,
  );
}

// Plantilla COMBINADA (colegio completo): una fila = alumno + su padre. El mismo padre se
// repite en la fila de cada hijo (el import agrupa por email/teléfono en una invitación).
export const COMBINED_TEMPLATE_HEADERS = [
  'alumno_nombre',
  'alumno_apellido',
  'grado',
  'matricula',
  'padre_nombre',
  'padre_apellido',
  'email',
  'whatsapp',
];

export function combinedTemplateSample(dialPrefix: string): Cell[][] {
  return [
    ['Sofía', 'Martínez', 'Primero A', '7047', 'Laura', 'Martínez', 'laura.martinez@example.com', `${dialPrefix}5512345601`],
    ['Ana', 'Rodríguez', 'Primero A', '8585', 'Carlos', 'Rodríguez', 'carlos.rodriguez@example.com', ''],
    ['Valentina', 'Rodríguez', 'Segundo B', '7913', 'Carlos', 'Rodríguez', 'carlos.rodriguez@example.com', ''],
    ['Mateo', 'González', 'Segundo B', '8226', 'Lucía', 'Pérez', '', `${dialPrefix}5512345604`],
    ['Diego', 'García', 'Tercero A', '', 'Pedro', 'García', 'pedro.garcia@example.com', ''],
  ];
}

export function downloadCombinedTemplate(format: TemplateFormat, dialPrefix: string): void {
  downloadWorkbook(
    [COMBINED_TEMPLATE_HEADERS, ...combinedTemplateSample(dialPrefix)],
    'plantilla-colegio-completo',
    format,
  );
}

// Plantilla de padres PRECARGADA con los alumnos del colegio (idea del cliente): una fila
// por alumno, con su nombre (referencia) y su ID ya puestos; el director solo agrega el
// padre de cada uno y re-sube. La columna `id_alumno` usa la matrícula si existe, sino el
// id interno — así no importa que la matrícula sea opcional.
export const PREFILLED_PARENT_HEADERS = [
  'alumno',
  'id_alumno',
  'padre_nombre',
  'padre_apellido',
  'email',
  'whatsapp',
];

export interface PrefillStudent {
  id: string;
  name: string;
  externalId: string | null;
}

export function downloadPrefilledParentTemplate(
  students: PrefillStudent[],
  format: TemplateFormat,
): void {
  const rows: Cell[][] = [
    PREFILLED_PARENT_HEADERS,
    ...students.map((s) => [s.name, s.externalId ?? s.id, '', '', '', '']),
  ];
  downloadWorkbook(rows, 'plantilla-padres-con-alumnos', format);
}
