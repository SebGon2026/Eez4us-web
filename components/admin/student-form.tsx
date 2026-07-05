'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { ResendButton } from '@/components/admin/resend-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface Grade {
  id: string;
  name: string;
}

interface Rep {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ExistingRep {
  id: string;
  name: string | null;
  email: string | null;
  phoneE164: string | null;
}

interface PendingInvitation {
  id: string;
  recipientName: string | null;
  channel: 'EMAIL' | 'WHATSAPP';
  contactValue: string;
  status: string;
  sentAt: string | null;
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
    pickupMode: 'PRIVATE_VEHICLE' | 'TRANSPORT' | 'WALKING';
    transportName: string | null;
    transportPlate: string | null;
    transportPhone: string | null;
    transportVehicleType: 'BUS' | 'VAN' | null;
  };
  existingReps?: ExistingRep[];
  pendingInvitations?: PendingInvitation[];
}

const emptyRep: Rep = { firstName: '', lastName: '', email: '', phone: '' };

interface RepPayloadResponse {
  invitations?: { createdCount: number; sentCount: number };
  repErrors?: Array<{ rep: string; reason: string }>;
}

function repToPayload(r: Rep) {
  return {
    firstName: r.firstName.trim(),
    lastName: r.lastName.trim(),
    email: r.email.trim() || null,
    phoneE164: r.phone.trim() || null,
  };
}

function toastInvitations(
  t: ReturnType<typeof useTranslations>,
  data: RepPayloadResponse,
  created: number,
  sent: number,
) {
  if (created > 0) {
    toast.success(t('form.toasts.invitationsSent', { sent, created }));
  }
  if (data.repErrors && data.repErrors.length > 0) {
    toast.error(t('form.toasts.invitationsUnsent', { count: data.repErrors.length }));
  }
}

export function StudentForm({
  schoolId,
  studentId,
  grades,
  initial,
  existingReps = [],
  pendingInvitations = [],
}: StudentFormProps) {
  const router = useRouter();
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  const tInvitations = useTranslations('invitations');
  const isEdit = Boolean(studentId);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [gradeId, setGradeId] = useState(initial.gradeId ?? '');
  const [externalId, setExternalId] = useState(initial.externalId ?? '');
  const [birthDate, setBirthDate] = useState(initial.birthDate?.slice(0, 10) ?? '');
  const [pickupMode, setPickupMode] = useState<'PRIVATE_VEHICLE' | 'TRANSPORT' | 'WALKING'>(
    initial.pickupMode,
  );
  const [transportName, setTransportName] = useState(initial.transportName ?? '');
  const [transportPlate, setTransportPlate] = useState(initial.transportPlate ?? '');
  const [transportPhone, setTransportPhone] = useState(initial.transportPhone ?? '');
  const [transportVehicleType, setTransportVehicleType] = useState<'' | 'BUS' | 'VAN'>(
    initial.transportVehicleType ?? '',
  );
  const [reps, setReps] = useState<Rep[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addRep() {
    setReps((r) => [...r, { ...emptyRep }]);
  }
  function removeRep(index: number) {
    setReps((r) => r.filter((_, i) => i !== index));
  }
  function updateRep(index: number, field: keyof Rep, value: string) {
    setReps((r) => r.map((rep, i) => (i === index ? { ...rep, [field]: value } : rep)));
  }

  function validateReps(): string | null {
    for (const rep of reps) {
      if (!rep.firstName.trim() || !rep.lastName.trim()) {
        return t('form.validation.repName');
      }
      if (!rep.email.trim() && !rep.phone.trim()) {
        return t('form.validation.repContact');
      }
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const repError = validateReps();
    if (repError) {
      setError(repError);
      return;
    }

    if (pickupMode === 'TRANSPORT') {
      if (!transportName.trim() || !transportPlate.trim() || !transportVehicleType) {
        setError(t('form.validation.transport'));
        return;
      }
    }

    setSubmitting(true);
    try {
      const isTransport = pickupMode === 'TRANSPORT';
      const studentBody = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gradeId: gradeId || null,
        externalId: externalId.trim() || null,
        birthDate: birthDate ? new Date(birthDate).toISOString() : null,
        pickupMode,
        transportName: isTransport ? transportName.trim() || null : null,
        transportPlate: isTransport ? transportPlate.trim() || null : null,
        transportPhone: isTransport ? transportPhone.trim() || null : null,
        transportVehicleType: isTransport ? transportVehicleType || null : null,
      };

      if (isEdit) {
        const res = await fetch(`/api/schools/${schoolId}/students/${studentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentBody),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setError(data.error ?? t('form.errors.saveFailed'));
          return;
        }

        if (reps.length > 0) {
          const repRes = await fetch(
            `/api/schools/${schoolId}/students/${studentId}/representatives`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ representatives: reps.map(repToPayload) }),
            },
          );
          if (repRes.ok) {
            const data = (await repRes.json()) as RepPayloadResponse;
            toastInvitations(
              t,
              data,
              data.invitations?.createdCount ?? 0,
              data.invitations?.sentCount ?? 0,
            );
          } else {
            const data = (await repRes.json().catch(() => ({}))) as { error?: string };
            toast.error(data.error ?? t('form.toasts.invitationsCreateFailed'));
          }
        }

        toast.success(t('form.toasts.changesSaved'));
      } else {
        const res = await fetch(`/api/schools/${schoolId}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...studentBody, representatives: reps.map(repToPayload) }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setError(data.error ?? t('form.errors.saveFailed'));
          return;
        }
        const data = (await res.json()) as RepPayloadResponse;
        const created = data.invitations?.createdCount ?? 0;
        if (created === 0) {
          toast.success(t('form.toasts.studentCreated'));
        } else {
          toast.success(
            t('form.toasts.studentCreatedWithInvitations', {
              sent: data.invitations?.sentCount ?? 0,
              created,
            }),
          );
        }
        if (data.repErrors && data.repErrors.length > 0) {
          toast.error(t('form.toasts.invitationsUnsent', { count: data.repErrors.length }));
        }
      }

      router.push('/admin/students');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('form.errors.unexpected'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t('form.firstName')}</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t('form.lastName')}</Label>
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
            <Label htmlFor="gradeId">{tCommon('fields.grade')}</Label>
            <Select id="gradeId" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
              <option value="">{t('form.noGradeOption')}</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="externalId">{t('form.externalId')}</Label>
            <Input
              id="externalId"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder={t('form.externalIdPlaceholder')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">{t('form.birthDate')}</Label>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-black">{t('form.pickup.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('form.pickup.subtitle')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickupMode">{t('form.pickup.mode')}</Label>
          <Select
            id="pickupMode"
            value={pickupMode}
            onChange={(e) =>
              setPickupMode(e.target.value as 'PRIVATE_VEHICLE' | 'TRANSPORT' | 'WALKING')
            }
          >
            <option value="PRIVATE_VEHICLE">{t('form.pickup.privateVehicle')}</option>
            <option value="WALKING">{t('form.pickup.walking')}</option>
            <option value="TRANSPORT">{t('form.pickup.transport')}</option>
          </Select>
          <p className="text-xs text-muted-foreground">
            {pickupMode === 'PRIVATE_VEHICLE'
              ? t('form.pickup.privateVehicleHint')
              : pickupMode === 'WALKING'
                ? t('form.pickup.walkingHint')
                : t('form.pickup.transportHint')}
          </p>
        </div>

        {pickupMode === 'TRANSPORT' && (
          <div className="space-y-4 rounded-2xl border bg-secondary/30 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transportName">{t('form.pickup.transportName')}</Label>
                <Input
                  id="transportName"
                  value={transportName}
                  onChange={(e) => setTransportName(e.target.value)}
                  placeholder={t('form.pickup.transportNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transportVehicleType">{t('form.pickup.vehicleType')}</Label>
                <Select
                  id="transportVehicleType"
                  value={transportVehicleType}
                  onChange={(e) => setTransportVehicleType(e.target.value as '' | 'BUS' | 'VAN')}
                >
                  <option value="">{t('form.pickup.vehicleTypePlaceholder')}</option>
                  <option value="VAN">{t('form.pickup.van')}</option>
                  <option value="BUS">{t('form.pickup.bus')}</option>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transportPlate">{t('form.pickup.plate')}</Label>
                <Input
                  id="transportPlate"
                  value={transportPlate}
                  onChange={(e) => setTransportPlate(e.target.value)}
                  placeholder={t('form.pickup.platePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transportPhone">{t('form.pickup.phone')}</Label>
                <Input
                  id="transportPhone"
                  value={transportPhone}
                  onChange={(e) => setTransportPhone(e.target.value)}
                  placeholder={t('form.pickup.phonePlaceholder')}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-black">{t('form.reps.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('form.reps.subtitle')}</p>
        </div>

        {isEdit && existingReps.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase text-muted-foreground">
              {t('form.reps.withAccount')}
            </h3>
            <ul className="space-y-2">
              {existingReps.map((rep) => (
                <li key={rep.id} className="rounded-2xl border bg-secondary/30 p-3 text-sm">
                  <p className="font-bold">{rep.name ?? t('form.reps.fallbackName')}</p>
                  <p className="text-xs text-muted-foreground">
                    {rep.email ?? rep.phoneE164 ?? '—'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isEdit && pendingInvitations.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase text-muted-foreground">
              {t('form.reps.pendingInvitations')}
            </h3>
            <ul className="space-y-2">
              {pendingInvitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border bg-secondary/30 p-3 text-sm"
                >
                  <div>
                    <p className="font-bold">{inv.recipientName ?? t('form.reps.fallbackName')}</p>
                    <p className="text-xs text-muted-foreground">
                      {tInvitations(`channel.${inv.channel}`)} · {inv.contactValue} ·{' '}
                      {tInvitations(`status.${inv.status}`)}
                    </p>
                  </div>
                  <ResendButton schoolId={schoolId} invitationId={inv.id} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          {reps.map((rep, index) => (
            <div key={index} className="space-y-4 rounded-2xl border bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground">
                  {t('form.reps.newRep', { number: index + 1 })}
                </span>
                <button
                  type="button"
                  onClick={() => removeRep(index)}
                  className="text-sm font-bold text-destructive hover:underline"
                >
                  {t('form.reps.remove')}
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`rep-${index}-firstName`}>{t('form.reps.firstName')}</Label>
                  <Input
                    id={`rep-${index}-firstName`}
                    value={rep.firstName}
                    onChange={(e) => updateRep(index, 'firstName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`rep-${index}-lastName`}>{t('form.reps.lastName')}</Label>
                  <Input
                    id={`rep-${index}-lastName`}
                    value={rep.lastName}
                    onChange={(e) => updateRep(index, 'lastName', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`rep-${index}-email`}>{t('form.reps.email')}</Label>
                  <Input
                    id={`rep-${index}-email`}
                    type="email"
                    value={rep.email}
                    onChange={(e) => updateRep(index, 'email', e.target.value)}
                    placeholder={t('form.reps.emailPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`rep-${index}-phone`}>{t('form.reps.phone')}</Label>
                  <Input
                    id={`rep-${index}-phone`}
                    value={rep.phone}
                    onChange={(e) => updateRep(index, 'phone', e.target.value)}
                    placeholder={t('form.reps.phonePlaceholder')}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t('form.reps.contactHint')}</p>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addRep}>
          {t('form.reps.add')}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/students')}
          disabled={submitting}
        >
          {tCommon('actions.cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? tCommon('actions.saving') : tCommon('actions.save')}
        </Button>
      </div>
    </form>
  );
}
