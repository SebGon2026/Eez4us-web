'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Grade {
  id: string;
  name: string;
  studentCount: number;
}

interface GradesManagerProps {
  schoolId: string;
  grades: Grade[];
}

export function GradesManager({ schoolId, grades }: GradesManagerProps) {
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    if (!newName.trim()) return;
    setPendingId('new');
    setError(null);
    try {
      const res = await fetch(`/api/schools/${schoolId}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'No se pudo crear');
        return;
      }
      setNewName('');
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function onSaveEdit() {
    if (!editing) return;
    setPendingId(editing.id);
    setError(null);
    try {
      const res = await fetch(`/api/schools/${schoolId}/grades/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editing.name.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'No se pudo guardar');
        return;
      }
      setEditing(null);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('¿Eliminar este grado?')) return;
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/schools/${schoolId}/grades/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'No se pudo eliminar');
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-bold" htmlFor="new-grade">
              Nuevo grado
            </label>
            <Input
              id="new-grade"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Primero A"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCreate();
              }}
            />
          </div>
          <Button onClick={onCreate} disabled={pendingId === 'new' || !newName.trim()}>
            {pendingId === 'new' ? 'Creando…' : 'Crear'}
          </Button>
        </div>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Alumnos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                  Sin grados creados aún.
                </TableCell>
              </TableRow>
            ) : (
              grades.map((g) => {
                const isEditing = editing?.id === g.id;
                return (
                  <TableRow key={g.id}>
                    <TableCell className="font-bold">
                      {isEditing ? (
                        <Input
                          value={editing.name}
                          onChange={(e) => setEditing({ id: g.id, name: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onSaveEdit();
                            if (e.key === 'Escape') setEditing(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        g.name
                      )}
                    </TableCell>
                    <TableCell>{g.studentCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={onSaveEdit}
                              disabled={pendingId === g.id || !editing.name.trim()}
                            >
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditing(null)}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditing({ id: g.id, name: g.name })}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onDelete(g.id)}
                              disabled={pendingId === g.id}
                            >
                              Eliminar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
