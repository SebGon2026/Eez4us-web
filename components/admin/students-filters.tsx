'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface Grade {
  id: string;
  name: string;
}

interface StudentsFiltersProps {
  grades: Grade[];
}

export function StudentsFilters({ grades }: StudentsFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [gradeId, setGradeId] = useState(params.get('gradeId') ?? '');

  function apply(next: { q?: string; gradeId?: string }) {
    const sp = new URLSearchParams();
    const finalQ = next.q !== undefined ? next.q : q;
    const finalGrade = next.gradeId !== undefined ? next.gradeId : gradeId;
    if (finalQ) sp.set('q', finalQ);
    if (finalGrade) sp.set('gradeId', finalGrade);
    sp.set('page', '1');
    router.push(`/admin/students?${sp.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Buscar por nombre o apellido"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') apply({ q: e.currentTarget.value });
        }}
      />
      <Select
        value={gradeId}
        onChange={(e) => {
          setGradeId(e.target.value);
          apply({ gradeId: e.target.value });
        }}
        className="sm:max-w-xs"
      >
        <option value="">Todos los grados</option>
        {grades.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
