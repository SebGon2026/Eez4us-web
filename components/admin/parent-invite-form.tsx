'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  externalId: string | null;
  gradeName: string | null;
}

interface ParentInviteFormProps {
  schoolId: string;
  students: StudentOption[];
}

interface InviteResponse {
  invitations?: { createdCount: number; sentCount: number };
  repErrors?: Array<{ rep: string; reason: string }>;
  error?: string;
}

export function ParentInviteForm({ schoolId, students }: ParentInviteFormProps) {
  const router = useRouter();
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      `${s.firstName} ${s.lastName} ${s.externalId ?? ''}`.toLowerCase().includes(q),
    );
  }, [students, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selected.size === 0) {
      setError(t('families.new.validation.noStudent'));
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError(t('form.validation.repName'));
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError(t('form.validation.repContact'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/invite-parent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: [...selected],
          representative: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim() || null,
            phoneE164: phone.trim() || null,
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as InviteResponse;
      if (!res.ok) {
        setError(data.error ?? t('form.errors.saveFailed'));
        return;
      }
      const created = data.invitations?.createdCount ?? 0;
      if (created > 0) {
        toast.success(
          t('form.toasts.invitationsSent', {
            sent: data.invitations?.sentCount ?? 0,
            created,
          }),
        );
        router.push('/admin/invitations');
        router.refresh();
      } else {
        const reason = data.repErrors?.[0]?.reason;
        setError(reason ?? t('form.toasts.invitationsCreateFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('form.errors.unexpected'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-black">{t('families.new.studentsTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('families.new.studentsSubtitle')}</p>
        </div>

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('families.new.searchStudents')}
        />

        <div className="max-h-72 space-y-1 overflow-y-auto rounded-2xl border p-2">
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">{t('families.new.noStudents')}</p>
          ) : (
            filtered.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-secondary/50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="flex-1 text-sm">
                  <span className="font-bold">
                    {s.lastName}, {s.firstName}
                  </span>
                  {s.gradeName && (
                    <span className="ml-2 text-xs text-muted-foreground">{s.gradeName}</span>
                  )}
                </span>
                {s.externalId && (
                  <span className="font-mono text-xs text-muted-foreground">{s.externalId}</span>
                )}
              </label>
            ))
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t('families.new.selectedCount', { count: selected.size })}
        </p>
      </div>

      <div className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-black">{t('families.new.parentTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('families.new.parentSubtitle')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-firstName">{t('form.reps.firstName')}</Label>
            <Input
              id="p-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-lastName">{t('form.reps.lastName')}</Label>
            <Input id="p-lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-email">{t('form.reps.email')}</Label>
            <Input
              id="p-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('form.reps.emailPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-phone">{t('form.reps.phone')}</Label>
            <Input
              id="p-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('form.reps.phonePlaceholder')}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t('form.reps.contactHint')}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/families')}
          disabled={submitting}
        >
          {tCommon('actions.cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? tCommon('actions.saving') : t('families.new.submit')}
        </Button>
      </div>
    </form>
  );
}
