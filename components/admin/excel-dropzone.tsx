'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type ParentRow, parseParentsExcel } from '@/lib/excel';
import {
  downloadParentTemplate,
  downloadPrefilledParentTemplate,
  parentTemplateSample,
  type PrefillStudent,
} from '@/lib/excel-template';
import { dialPrefixForCountry } from '@/lib/phone';
import { cn } from '@/lib/utils';

interface BulkResult {
  createdCount: number;
  rowErrors: Array<{ parent: string; reason: string }>;
  coverage?: { totalStudents: number; withoutParent: number };
  studentsWithoutParent?: Array<{ name: string; externalId: string | null }>;
}

interface ExcelDropzoneProps {
  schoolId: string;
  // País de la escuela: define el prefijo de los teléfonos de ejemplo de la plantilla.
  country?: string | null;
  // Alumnos del colegio: habilitan la plantilla PRECARGADA (una fila por alumno).
  students?: PrefillStudent[];
}

export function ExcelDropzone({ schoolId, country, students = [] }: ExcelDropzoneProps) {
  const t = useTranslations('invitations');
  const tCommon = useTranslations('common');
  const dialPrefix = dialPrefixForCountry(country) ?? '+52';
  const sample = parentTemplateSample(dialPrefix);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParentRow[]>([]);
  const [previewErrors, setPreviewErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      setError(null);
      setResult(null);
      const f = accepted[0];
      if (!f) return;
      setFile(f);
      const buf = await f.arrayBuffer();
      const parsed = parseParentsExcel(new Uint8Array(buf), country);
      setPreview(parsed.parents.slice(0, 20));
      setPreviewErrors(parsed.errors.slice(0, 20));
    },
    [country],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
  });

  async function onConfirm() {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/schools/${schoolId}/invite-bulk`, {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json()) as BulkResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? t('dropzone.importFailed'));
        return;
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('dropzone.unexpectedError'));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview([]);
    setPreviewErrors([]);
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-2xl border bg-card p-4">
        {students.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-primary/5 p-3">
            <span className="text-sm font-bold">{t('dropzone.prefilled.label')}</span>
            <Button size="sm" onClick={() => downloadPrefilledParentTemplate(students, 'xlsx')}>
              {t('dropzone.prefilled.download', { count: students.length })}
            </Button>
            <span className="text-xs text-muted-foreground">{t('dropzone.prefilled.hint')}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold">{t('dropzone.template.label')}</span>
          <Button variant="outline" size="sm" onClick={() => downloadParentTemplate('xlsx', dialPrefix)}>
            {t('dropzone.template.xlsx')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadParentTemplate('csv', dialPrefix)}>
            {t('dropzone.template.csv')}
          </Button>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-input bg-card',
        )}
      >
        <input {...getInputProps()} />
        <p className="text-base font-bold">
          {isDragActive ? t('dropzone.dropActive') : t('dropzone.dropIdle')}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{t('dropzone.columnsHint')}</p>
      </div>

      {!file && (
        <div className="rounded-3xl border bg-card p-6">
          <p className="text-sm font-bold">{t('dropzone.example.title')}</p>
          <p className="mb-4 text-xs text-muted-foreground">{t('dropzone.example.hint')}</p>
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-black uppercase">nombre</th>
                  <th className="px-3 py-2 text-left text-xs font-black uppercase">apellido</th>
                  <th className="px-3 py-2 text-left text-xs font-black uppercase">email</th>
                  <th className="px-3 py-2 text-left text-xs font-black uppercase">whatsapp</th>
                  <th className="px-3 py-2 text-left text-xs font-black uppercase">ids_alumnos</th>
                </tr>
              </thead>
              <tbody>
                {sample.map((row, i) => (
                  <tr key={i} className="border-t">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 font-mono text-xs">
                        {String(cell) || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {file && (
        <div className="rounded-3xl border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {t('dropzone.previewSummary', {
                  valid: preview.length,
                  errors: previewErrors.length,
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              {t('dropzone.removeFile')}
            </button>
          </div>

          {preview.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('dropzone.columns.parent')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('dropzone.columns.contact')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('dropzone.columns.channel')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('dropzone.columns.studentIds')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => {
                    const channel = row.email ? 'EMAIL' : 'WHATSAPP';
                    return (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 font-medium">
                          {row.firstName} {row.lastName}
                        </td>
                        <td className="px-3 py-2">{row.email ?? row.phoneE164}</td>
                        <td className="px-3 py-2">
                          <Badge variant={channel === 'EMAIL' ? 'default' : 'success'}>
                            {channel}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {row.studentExternalIds.join(', ')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {previewErrors.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-destructive">
              {previewErrors.map((e, i) => (
                <li key={i}>{t('dropzone.rowError', { row: e.row, message: e.message })}</li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={reset} disabled={submitting}>
              {tCommon('actions.cancel')}
            </Button>
            <Button onClick={onConfirm} disabled={submitting || preview.length === 0}>
              {submitting
                ? t('dropzone.importing')
                : t('dropzone.importCount', { count: preview.length })}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-destructive bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-3xl border bg-card p-6">
          <h3 className="text-lg font-black">{t('dropzone.result.title')}</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm">
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                {t('dropzone.result.created')}
              </p>
              <p className="text-2xl font-black">{result.createdCount}</p>
            </div>
          </div>

          {result.createdCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="text-sm font-bold text-amber-900">{t('dropzone.result.pendingNote')}</p>
              <Button asChild size="sm">
                <Link href="/admin/invitations?status=PENDING">{t('dropzone.result.goSend')}</Link>
              </Button>
            </div>
          )}

          {result.rowErrors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold">{t('dropzone.result.rowErrors')}</p>
              <ul className="mt-2 space-y-1 text-xs text-destructive">
                {result.rowErrors.map((e, i) => (
                  <li key={i}>
                    {e.parent}: {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.coverage &&
            (result.coverage.withoutParent === 0 ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-800">
                {t('dropzone.result.coverageComplete', { total: result.coverage.totalStudents })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-sm font-bold text-amber-900">
                  {t('dropzone.result.coverageMissing', {
                    count: result.coverage.withoutParent,
                    total: result.coverage.totalStudents,
                  })}
                </p>
                {result.studentsWithoutParent && result.studentsWithoutParent.length > 0 && (
                  <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-xs text-amber-800">
                    {result.studentsWithoutParent.map((s, i) => (
                      <li key={i}>
                        {s.name}
                        {s.externalId ? ` · ${s.externalId}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

          <Button className="mt-6" variant="outline" onClick={reset}>
            {t('dropzone.result.importAnother')}
          </Button>
        </div>
      )}
    </div>
  );
}
