'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type CombinedRow, parseCombinedExcel } from '@/lib/combined-excel';
import {
  COMBINED_TEMPLATE_HEADERS,
  combinedTemplateSample,
  downloadCombinedTemplate,
} from '@/lib/excel-template';
import { dialPrefixForCountry } from '@/lib/phone';
import { cn } from '@/lib/utils';

interface CombinedResult {
  studentsCreated: number;
  studentsUpdated: number;
  invitationsCreated: number;
  invitationsMerged: number;
  skippedClaimed: Array<{ parent: string; contact: string }>;
  rowErrors: Array<{ item: string; reason: string }>;
  warningList: Array<{ item: string; reason: string }>;
}

interface CombinedImportDropzoneProps {
  schoolId: string;
  country?: string | null;
}

export function CombinedImportDropzone({ schoolId, country }: CombinedImportDropzoneProps) {
  const t = useTranslations('invitations');
  const tCommon = useTranslations('common');
  const dialPrefix = dialPrefixForCountry(country) ?? '+52';
  const sample = combinedTemplateSample(dialPrefix);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CombinedRow[]>([]);
  const [previewErrors, setPreviewErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [validCount, setValidCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CombinedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      setError(null);
      setResult(null);
      const f = accepted[0];
      if (!f) return;
      setFile(f);
      const buf = await f.arrayBuffer();
      const parsed = parseCombinedExcel(new Uint8Array(buf), country);
      setValidCount(parsed.rows.length);
      setPreview(parsed.rows.slice(0, 20));
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
      const res = await fetch(`/api/schools/${schoolId}/students/import-combined`, {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json()) as CombinedResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? t('combinedImport.dropzone.importFailed'));
        return;
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('combinedImport.dropzone.unexpectedError'));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview([]);
    setPreviewErrors([]);
    setValidCount(0);
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
        <span className="text-sm font-bold">{t('combinedImport.template.label')}</span>
        <Button variant="outline" size="sm" onClick={() => downloadCombinedTemplate('xlsx', dialPrefix)}>
          {t('combinedImport.template.xlsx')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadCombinedTemplate('csv', dialPrefix)}>
          {t('combinedImport.template.csv')}
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
          {isDragActive
            ? t('combinedImport.dropzone.dropActive')
            : t('combinedImport.dropzone.dropIdle')}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {t('combinedImport.dropzone.columnsHint')}
        </p>
      </div>

      {!file && (
        <div className="rounded-3xl border bg-card p-6">
          <p className="text-sm font-bold">{t('combinedImport.dropzone.example.title')}</p>
          <p className="mb-4 text-xs text-muted-foreground">
            {t('combinedImport.dropzone.example.hint')}
          </p>
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {COMBINED_TEMPLATE_HEADERS.map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-black uppercase">
                      {h}
                    </th>
                  ))}
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
                {t('combinedImport.dropzone.previewSummary', {
                  valid: validCount,
                  errors: previewErrors.length,
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              {t('combinedImport.dropzone.removeFile')}
            </button>
          </div>

          {preview.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('combinedImport.dropzone.columns.student')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('combinedImport.dropzone.columns.grade')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('combinedImport.dropzone.columns.externalId')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('combinedImport.dropzone.columns.parent')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('combinedImport.dropzone.columns.contact')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">
                      {t('combinedImport.dropzone.columns.channel')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 font-medium">
                        {row.student.firstName} {row.student.lastName}
                      </td>
                      <td className="px-3 py-2 text-xs">{row.student.gradeName ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {row.student.externalId ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        {row.parent ? (
                          `${row.parent.firstName} ${row.parent.lastName}`
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t('combinedImport.dropzone.studentOnly')}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {row.parent ? (row.parent.email ?? row.parent.phoneE164) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {row.parent && (
                          <Badge variant={row.parent.email ? 'default' : 'success'}>
                            {row.parent.email ? 'EMAIL' : 'WHATSAPP'}
                          </Badge>
                        )}
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
                <li key={i}>
                  {t('combinedImport.dropzone.rowError', { row: e.row, message: e.message })}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={reset} disabled={submitting}>
              {tCommon('actions.cancel')}
            </Button>
            <Button onClick={onConfirm} disabled={submitting || validCount === 0}>
              {submitting
                ? t('combinedImport.dropzone.importing')
                : t('combinedImport.dropzone.importCount', { count: validCount })}
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
          <h3 className="text-lg font-black">{t('combinedImport.result.title')}</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                {t('combinedImport.result.studentsCreated')}
              </p>
              <p className="text-2xl font-black">{result.studentsCreated}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                {t('combinedImport.result.studentsUpdated')}
              </p>
              <p className="text-2xl font-black">{result.studentsUpdated}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                {t('combinedImport.result.invitationsCreated')}
              </p>
              <p className="text-2xl font-black">{result.invitationsCreated}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                {t('combinedImport.result.invitationsMerged')}
              </p>
              <p className="text-2xl font-black">{result.invitationsMerged}</p>
            </div>
          </div>

          {(result.invitationsCreated > 0 || result.invitationsMerged > 0) && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="text-sm font-bold text-amber-900">
                {t('combinedImport.result.pendingNote')}
              </p>
              <Button asChild size="sm">
                <Link href="/admin/invitations?status=PENDING">
                  {t('combinedImport.result.goSend')}
                </Link>
              </Button>
            </div>
          )}

          {result.skippedClaimed.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold">{t('combinedImport.result.skippedClaimed')}</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {result.skippedClaimed.map((s, i) => (
                  <li key={i}>
                    {s.parent} · {s.contact}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.warningList.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-amber-700">
              {result.warningList.map((w, i) => (
                <li key={i}>
                  {w.item}: {w.reason}
                </li>
              ))}
            </ul>
          )}

          {result.rowErrors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold">{t('combinedImport.result.errors')}</p>
              <ul className="mt-2 space-y-1 text-xs text-destructive">
                {result.rowErrors.map((e, i) => (
                  <li key={i}>
                    {e.item}: {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button className="mt-6" variant="outline" onClick={reset}>
            {t('combinedImport.result.importAnother')}
          </Button>
        </div>
      )}
    </div>
  );
}
