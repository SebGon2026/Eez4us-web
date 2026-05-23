'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type ParentRow,parseParentsExcel } from '@/lib/excel';
import { cn } from '@/lib/utils';

interface BulkResult {
  createdCount: number;
  sentCount: number;
  rowErrors: Array<{ parent: string; reason: string }>;
  sendFailures: Array<{ parent: string; reason: string }>;
}

interface ExcelDropzoneProps {
  schoolId: string;
}

export function ExcelDropzone({ schoolId }: ExcelDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParentRow[]>([]);
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
    const parsed = parseParentsExcel(new Uint8Array(buf));
    setPreview(parsed.parents.slice(0, 20));
    setPreviewErrors(parsed.errors.slice(0, 20));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
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
        setError(data.error ?? 'Error al importar');
        return;
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
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
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-input bg-card',
        )}
      >
        <input {...getInputProps()} />
        <p className="text-base font-bold">
          {isDragActive ? 'Soltá el archivo aquí' : 'Arrastrá un .xlsx o hacé click'}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Columnas: nombre, apellido, email, whatsapp, ids_alumnos (separados por coma)
        </p>
      </div>

      {file && (
        <div className="rounded-3xl border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {preview.length} válidas · {previewErrors.length} con errores · vista previa primeras 20
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Quitar archivo
            </button>
          </div>

          {preview.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">Padre</th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">Contacto</th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">Canal</th>
                    <th className="px-3 py-2 text-left text-xs font-black uppercase">IDs alumnos</th>
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
                <li key={i}>
                  Fila {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={reset} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={onConfirm} disabled={submitting || preview.length === 0}>
              {submitting ? 'Importando…' : `Importar ${preview.length} padres`}
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
          <h3 className="text-lg font-black">Resultado</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">Creadas</p>
              <p className="text-2xl font-black">{result.createdCount}</p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">Enviadas</p>
              <p className="text-2xl font-black">{result.sentCount}</p>
            </div>
          </div>

          {result.rowErrors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold">Filas con error</p>
              <ul className="mt-2 space-y-1 text-xs text-destructive">
                {result.rowErrors.map((e, i) => (
                  <li key={i}>
                    {e.parent}: {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.sendFailures.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold">Envíos fallidos</p>
              <ul className="mt-2 space-y-1 text-xs text-destructive">
                {result.sendFailures.map((e, i) => (
                  <li key={i}>
                    {e.parent}: {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button className="mt-6" variant="outline" onClick={reset}>
            Importar otro archivo
          </Button>
        </div>
      )}
    </div>
  );
}
