'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/button';
import {
  downloadStudentTemplate,
  STUDENT_TEMPLATE_SAMPLE,
} from '@/lib/excel-template';
import { parseStudentsExcel,type StudentRow } from '@/lib/student-excel';
import { cn } from '@/lib/utils';

interface BulkResult {
  createdCount: number;
  updatedCount: number;
  errorRows: number;
  warnings: number;
  rowErrors: Array<{ student: string; reason: string }>;
  warningList: Array<{ student: string; reason: string }>;
}

interface StudentImportDropzoneProps {
  schoolId: string;
}

export function StudentImportDropzone({ schoolId }: StudentImportDropzoneProps) {
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<StudentRow[]>([]);
  const [previewErrors, setPreviewErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (accepted: File[]) => {
    setError(null);
    setResult(null);
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    const buf = await f.arrayBuffer();
    const parsed = parseStudentsExcel(new Uint8Array(buf));
    setPreview(parsed.students.slice(0, 20));
    setPreviewErrors(parsed.errors.slice(0, 20));
  }, []);

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
      const res = await fetch(`/api/schools/${schoolId}/students/import-bulk`, {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json()) as BulkResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? t('import.dropzone.importFailed'));
        return;
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('import.dropzone.unexpectedError'));
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
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
        <span className="text-sm font-bold">{t('import.template.label')}</span>
        <Button variant="outline" size="sm" onClick={() => downloadStudentTemplate('xlsx')}>
          {t('import.template.xlsx')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadStudentTemplate('csv')}>
          {t('import.template.csv')}
        </Button>
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
          {isDragActive ? t('import.dropzone.dropActive') : t('import.dropzone.dropIdle')}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{t('import.dropzone.columnsHint')}</p>
      </div>

      {!file && (
        <div className="rounded-3xl border bg-card p-6">
          <p className="text-sm font-bold">{t('import.dropzone.example.title')}</p>
          <p className="mb-4 text-xs text-muted-foreground">{t('import.dropzone.example.hint')}</p>
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-black uppercase">nombre</th>
                  <th className="px-3 py-2 text-left text-xs font-black uppercase">apellido</th>
                  <th className="px-3 py-2 text-left text-xs font-black uppercase">grado</th>
                  <th className="px-3 py-2 text-left text-xs font-black uppercase">matricula</th>
                  <th className="px-3 py-2 text-left text-xs font-black uppercase">nacimiento</th>
                </tr>
              </thead>
              <tbody>
                {STUDENT_TEMPLATE_SAMPLE.map((row, i) => (
                  <tr key={i} className="border-t">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 font-mono text-xs">
                        {String(cell)}
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
                {t('import.dropzone.previewSummary', {
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
              {t('import.dropzone.removeFile')}
            </button>
          </div>

          {preview.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('import.dropzone.columns.student')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('import.dropzone.columns.grade')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('import.dropzone.columns.externalId')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 font-medium">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {row.gradeName ?? (
                          <span className="text-muted-foreground">
                            {t('import.dropzone.noGrade')}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {row.externalId ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {previewErrors.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-destructive">
              {previewErrors.map((e, i) => (
                <li key={i}>{t('import.dropzone.rowError', { row: e.row, message: e.message })}</li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={reset} disabled={submitting}>
              {tCommon('actions.cancel')}
            </Button>
            <Button onClick={onConfirm} disabled={submitting || preview.length === 0}>
              {submitting
                ? t('import.dropzone.importing')
                : t('import.dropzone.importCount', { count: preview.length })}
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
          <h3 className="text-lg font-black">{t('import.result.title')}</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                {t('import.result.created')}
              </p>
              <p className="text-2xl font-black">{result.createdCount}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                {t('import.result.updated')}
              </p>
              <p className="text-2xl font-black">{result.updatedCount}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                {t('import.result.warnings')}
              </p>
              <p className="text-2xl font-black text-amber-600">{result.warnings}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                {t('import.result.errors')}
              </p>
              <p className="text-2xl font-black text-destructive">{result.errorRows}</p>
            </div>
          </div>

          {result.warningList.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-amber-700">
              {result.warningList.map((w, i) => (
                <li key={i}>
                  {w.student}: {w.reason}
                </li>
              ))}
            </ul>
          )}

          {result.rowErrors.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-destructive">
              {result.rowErrors.map((e, i) => (
                <li key={i}>
                  {e.student}: {e.reason}
                </li>
              ))}
            </ul>
          )}

          <Button className="mt-6" variant="outline" onClick={reset}>
            {t('import.result.importAnother')}
          </Button>
        </div>
      )}
    </div>
  );
}
