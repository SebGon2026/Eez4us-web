'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface Grade {
  id: string;
  name: string;
}

interface StudentFormProps {
  schoolId: string;
  studentId?: string;
  grades: Grade[];
  initial: {
    firstName: string;
    lastName: string;
    gradeId: string | null;
    externalId: string | null;
    birthDate: string | null;
  };
}

export function StudentForm({ schoolId, studentId, grades, initial }: StudentFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [gradeId, setGradeId] = useState(initial.gradeId ?? '');
  const [externalId, setExternalId] = useState(initial.externalId ?? '');
  const [birthDate, setBirthDate] = useState(initial.birthDate?.slice(0, 10) ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const url = studentId
        ? `/api/schools/${schoolId}/students/${studentId}`
        : `/api/schools/${schoolId}/students`;
      const body = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gradeId: gradeId || null,
        externalId: externalId.trim() || null,
        birthDate: birthDate ? new Date(birthDate).toISOString() : null,
      };
      const res = await fetch(url, {
        method: studentId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'No se pudo guardar');
        return;
      }
      router.push('/admin/students');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gradeId">Grado</Label>
          <Select id="gradeId" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
            <option value="">Sin asignar</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="externalId">Matrícula (opcional)</Label>
          <Input
            id="externalId"
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            placeholder="A-0042"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Fecha de nacimiento (opcional)</Label>
        <Input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/students')}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
