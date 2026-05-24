'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { SearchInput } from '@/components/search-input';
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
  const gradeId = params.get('gradeId') ?? '';

  function onGradeChange(next: string) {
    const sp = new URLSearchParams(params.toString());
    if (next) {
      sp.set('gradeId', next);
    } else {
      sp.delete('gradeId');
    }
    sp.delete('page');
    router.replace(`/admin/students?${sp.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput placeholder="Buscar por nombre, apellido o matrícula" />
      <Select
        value={gradeId}
        onChange={(e) => onGradeChange(e.target.value)}
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
