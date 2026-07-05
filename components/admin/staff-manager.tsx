'use client';

import { useTranslations } from 'next-intl';
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

const STAFF_ROLES: StaffRole[] = ['logistics', 'support_staff'];

const ERROR_CODES = new Set([
  'EMAIL_ALREADY_USED',
  'INVALID_BODY',
  'CANNOT_MODIFY_SELF',
  'CANNOT_MODIFY_ROLE',
]);

export function StaffManager({ schoolId, currentUserId, staff }: StaffManagerProps) {
  const t = useTranslations('schools');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<StaffRole>('logistics');
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function showError(code: string | undefined, fallback: string) {
    setError(code && ERROR_CODES.has(code) ? t(`staff.errors.${code}`) : fallback);
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
        showError(data.error, t('staff.createFailed'));
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
      !confirm(t('staff.confirmDeactivate', { name: member.name ?? member.email }))
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
        showError(data.error, t('staff.updateFailed'));
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
        <h2 className="mb-4 text-lg font-extrabold">{t('staff.addPerson')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="staff-name">{tCommon('fields.name')}</Label>
            <Input
              id="staff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('staff.namePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-email">{tCommon('fields.email')}</Label>
            <Input
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('staff.emailPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-password">{t('staff.tempPassword')}</Label>
            <Input
              id="staff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('staff.min8Chars')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-role">{tCommon('fields.role')}</Label>
            <Select
              id="staff-role"
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
            >
              <option value="logistics">{t('staff.roles.logistics.label')}</option>
              <option value="support_staff">{t('staff.roles.support_staff.label')}</option>
            </Select>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{t(`staff.roles.${role}.help`)}</p>

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
            {creating ? t('creating') : t('staff.createAccount')}
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon('fields.name')}</TableHead>
              <TableHead>{tCommon('fields.role')}</TableHead>
              <TableHead>{t('staff.deliveries')}</TableHead>
              <TableHead>{tCommon('fields.status')}</TableHead>
              <TableHead className="text-right">{tCommon('fields.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  {t('staff.empty')}
                </TableCell>
              </TableRow>
            ) : (
              staff.map((m) => {
                const isKnownRole = STAFF_ROLES.includes(m.role as StaffRole);
                const isSelf = m.id === currentUserId;
                return (
                  <TableRow key={m.id} className={m.active ? undefined : 'opacity-60'}>
                    <TableCell>
                      <div className="font-bold">{m.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {isKnownRole ? t(`staff.roles.${m.role}.label`) : m.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{m.deliveredCount}</TableCell>
                    <TableCell>
                      {m.active ? (
                        <Badge variant="success">{t('staff.activeBadge')}</Badge>
                      ) : (
                        <Badge variant="outline">{t('staff.deactivatedBadge')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={m.active ? 'outline' : 'default'}
                        onClick={() => onToggle(m)}
                        disabled={togglingId === m.id || isSelf}
                        title={isSelf ? t('staff.cannotDeactivateSelf') : undefined}
                      >
                        {togglingId === m.id
                          ? tCommon('actions.saving')
                          : m.active
                            ? t('staff.deactivate')
                            : t('staff.reactivate')}
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
