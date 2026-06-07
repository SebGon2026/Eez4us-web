'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type StaffRole = 'support_staff' | 'logistics';

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  deliveredCount: number;
}

interface StaffManagerProps {
  schoolId: string;
  currentUserId: string;
  staff: StaffMember[];
}

const ROLE_META: Record<StaffRole, { label: string; help: string }> = {
  logistics: {
    label: 'Portón (móvil)',
    help: 'La persona del portón. Ve las llegadas, escanea el QR del padre y confirma la entrega desde la app.',
  },
  support_staff: {
    label: 'Soporte (web)',
    help: 'Tablero web: ve llegadas, filtra y puede finalizar entregas. Sin acceso a finanzas.',
  },
};

const ERROR_LABELS: Record<string, string> = {
  EMAIL_ALREADY_USED: 'Ese email ya tiene una cuenta.',
  INVALID_BODY: 'Revisá los datos: nombre, email y contraseña (mínimo 8 caracteres).',
  CANNOT_MODIFY_SELF: 'No podés desactivar tu propia cuenta.',
  CANNOT_MODIFY_ROLE: 'Esa cuenta no se puede modificar desde acá.',
};

export function StaffManager({ schoolId, currentUserId, staff }: StaffManagerProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<StaffRole>('logistics');
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function showError(code: string | undefined, fallback: string) {
    setError(code ? (ERROR_LABELS[code] ?? fallback) : fallback);
  }

  async function onCreate() {
    if (!name.trim() || !email.trim() || password.length < 8) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/schools/${schoolId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        showError(data.error, 'No se pudo crear la cuenta.');
        return;
      }
      setName('');
      setEmail('');
      setPassword('');
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function onToggle(member: StaffMember) {
    const next = !member.active;
    if (
      !next &&
      !confirm(`¿Desactivar a ${member.name ?? member.email}? No podrá iniciar sesión.`)
    ) {
      return;
    }
    setTogglingId(member.id);
    setError(null);
    try {
      const res = await fetch(`/api/schools/${schoolId}/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: next }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        showError(data.error, 'No se pudo actualizar.');
        return;
      }
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-extrabold">Agregar persona</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="staff-name">Nombre</Label>
            <Input
              id="staff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Laura Méndez"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="porton@colegio.edu"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-password">Contraseña temporal</Label>
            <Input
              id="staff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-role">Rol</Label>
            <Select
              id="staff-role"
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
            >
              <option value="logistics">{ROLE_META.logistics.label}</option>
              <option value="support_staff">{ROLE_META.support_staff.label}</option>
            </Select>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{ROLE_META[role].help}</p>

        <div className="mt-5 flex items-center justify-between gap-4">
          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : (
            <span />
          )}
          <Button
            onClick={onCreate}
            disabled={creating || !name.trim() || !email.trim() || password.length < 8}
          >
            {creating ? 'Creando…' : 'Crear cuenta'}
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Entregas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Aún no hay personal cargado.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((m) => {
                const meta = ROLE_META[m.role as StaffRole];
                const isSelf = m.id === currentUserId;
                return (
                  <TableRow key={m.id} className={m.active ? undefined : 'opacity-60'}>
                    <TableCell>
                      <div className="font-bold">{m.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{meta?.label ?? m.role}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{m.deliveredCount}</TableCell>
                    <TableCell>
                      {m.active ? (
                        <Badge variant="success">Activa</Badge>
                      ) : (
                        <Badge variant="outline">Dada de baja</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={m.active ? 'outline' : 'default'}
                        onClick={() => onToggle(m)}
                        disabled={togglingId === m.id || isSelf}
                        title={isSelf ? 'No podés desactivar tu propia cuenta' : undefined}
                      >
                        {togglingId === m.id
                          ? 'Guardando…'
                          : m.active
                            ? 'Desactivar'
                            : 'Reactivar'}
                      </Button>
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
