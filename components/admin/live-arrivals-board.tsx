'use client';

import { CheckCircle2, Circle, Clock, MapPin, Radio } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { usePoll } from '@/lib/use-poll';
import { cn } from '@/lib/utils';

type Translator = ReturnType<typeof useTranslations>;

interface LiveTrip {
  id: string;
  parentName: string;
  studentNames: string[];
  pickupPointId?: string;
  pickupPointName: string;
  vehiclePlate: string;
  vehicleModel?: string;
  vehicleColor?: string;
  status: 'EN_CAMINO' | 'EN_ZONA' | string;
  // EN_CAMINO = GPS · ESTOY_AFUERA = padre afuera sin GPS · WALKUP = creado en portón
  origin?: 'EN_CAMINO' | 'ESTOY_AFUERA' | 'WALKUP';
  etaSeconds: number | null;
  lastLat: number | null;
  lastLng: number | null;
  lastPositionAt: string | null;
}

interface PickupPoint {
  id: string;
  name: string;
  radiusMeters: number;
}

interface DismissalBucket {
  time: string;
  levels: string[];
  gradeNames: string[];
  studentsCount: number;
}

interface LiveArrivalsBoardProps {
  pickupPoints: PickupPoint[];
  role: string;
  schoolName: string | null;
  dismissalBuckets?: DismissalBucket[];
}

function etaColor(seconds: number | null, t: Translator): { label: string; cls: string } {
  if (seconds == null) return { label: '—', cls: 'bg-muted text-muted-foreground border-border' };
  if (seconds <= 0)
    return { label: t('eta.arrived'), cls: 'bg-amber-100 text-amber-900 border-amber-300' };
  const mins = Math.round(seconds / 60);
  const label = t('eta.minutes', { count: mins });
  if (mins <= 2) return { label, cls: 'bg-amber-100 text-amber-900 border-amber-300' };
  if (mins <= 5) return { label, cls: 'bg-yellow-50 text-yellow-900 border-yellow-200' };
  return { label, cls: 'bg-secondary text-foreground border-border' };
}

function relativeTime(iso: string | null, t: Translator): string {
  if (!iso) return '—';
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return t('time.secondsAgo', { count: diff });
  return t('time.minutes', { count: Math.round(diff / 60) });
}

// Calcula tiempo restante hasta la hora HH:MM de hoy
function timeUntil(
  hhmm: string,
  t: Translator,
): { label: string; pastSoon: boolean; isPast: boolean } {
  const [hh, mm] = hhmm.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) {
    return { label: hhmm, pastSoon: false, isPast: false };
  }
  const target = new Date();
  target.setHours(hh, mm, 0, 0);
  const diffMs = target.getTime() - Date.now();
  if (diffMs < -30 * 60 * 1000) return { label: t('time.passed'), pastSoon: false, isPast: true };
  if (diffMs < 0) return { label: t('time.fewMinutesAgo'), pastSoon: true, isPast: true };
  const mins = Math.round(diffMs / 60000);
  if (mins < 60)
    return { label: t('time.inMinutes', { count: mins }), pastSoon: mins <= 15, isPast: false };
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return {
    label: t('time.inHours', { hours: hrs, minutes: rem.toString().padStart(2, '0') }),
    pastSoon: false,
    isPast: false,
  };
}

function pickNextDismissal(
  buckets: DismissalBucket[],
  t: Translator,
): {
  bucket: DismissalBucket | null;
  whenLabel: string;
  isPast: boolean;
  pastSoon: boolean;
} {
  if (buckets.length === 0) return { bucket: null, whenLabel: '', isPast: false, pastSoon: false };
  // Buscar la próxima salida futura
  let candidate: DismissalBucket | null = null;
  let candidateMs = Number.POSITIVE_INFINITY;
  let candidateInfo = { label: '', pastSoon: false, isPast: false };
  const now = Date.now();
  for (const b of buckets) {
    const [hh, mm] = b.time.split(':').map(Number);
    const target = new Date();
    target.setHours(hh, mm, 0, 0);
    const diff = target.getTime() - now;
    if (diff > 0 && diff < candidateMs) {
      candidate = b;
      candidateMs = diff;
      candidateInfo = timeUntil(b.time, t);
    }
  }
  if (candidate) {
    return { bucket: candidate, whenLabel: candidateInfo.label, isPast: false, pastSoon: candidateInfo.pastSoon };
  }
  // Si todas pasaron, mostrar la última con cariño
  const last = buckets[buckets.length - 1];
  const info = timeUntil(last.time, t);
  return { bucket: last, whenLabel: info.label, isPast: true, pastSoon: false };
}

const STAFF_ROLES = new Set(['director', 'support_staff', 'super_admin']);

export function LiveArrivalsBoard({
  pickupPoints,
  role,
  dismissalBuckets = [],
}: LiveArrivalsBoardProps) {
  const t = useTranslations('dashboard.arrivals');
  const tc = useTranslations('common');
  const [trips, setTrips] = useState<LiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [finalizing, setFinalizing] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const canFinalize = STAFF_ROLES.has(role);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/live-trips', { credentials: 'include' });
      if (!res.ok) return false;
      const data = (await res.json()) as { trips: LiveTrip[] };
      const next = data.trips ?? [];
      setTrips(next);
      return next.length > 0;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fuera de la ventana de salida no hay un solo viaje: bajamos a 60s hasta que
  // aparezca el primero, y con la pestaña oculta no se pega nada.
  usePoll(fetchTrips, { activeMs: 5_000, idleMs: 60_000 });

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(tick);
  }, []);

  const filtered = useMemo(
    () =>
      trips.filter((t) =>
        filter === 'ALL' ? true : t.pickupPointName === filter || t.pickupPointId === filter,
      ),
    [trips, filter],
  );

  const nextDismissal = useMemo(
    () => pickNextDismissal(dismissalBuckets, t),
    [dismissalBuckets, now, t],
  );

  async function onFinalize(tripId: string) {
    if (!confirm(t('confirmHandoff'))) return;
    setFinalizing(tripId);
    try {
      const res = await fetch(`/api/trips/${tripId}/finalize`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(t('handoffConfirmed'));
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('handoffFailed'));
    } finally {
      setFinalizing(null);
    }
  }

  const outside = trips.filter(
    (t) => t.status === 'EN_ZONA' && t.origin && t.origin !== 'EN_CAMINO',
  ).length;
  const inZone = trips.filter(
    (t) => t.status === 'EN_ZONA' && (!t.origin || t.origin === 'EN_CAMINO'),
  ).length;
  const enRoute = trips.length - inZone - outside;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <span className="font-semibold text-muted-foreground">{t('refreshEvery')}</span>
        </div>
      </div>

      {/* Próxima tanda */}
      {nextDismissal.bucket && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5',
            nextDismissal.pastSoon
              ? 'border-amber-300 bg-amber-50/60'
              : nextDismissal.isPast
                ? 'border-border bg-secondary/40'
                : 'border-primary/30 bg-primary/5',
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                nextDismissal.pastSoon
                  ? 'bg-amber-100 text-amber-900'
                  : nextDismissal.isPast
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary/10 text-primary',
              )}
            >
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {nextDismissal.isPast ? t('nextDismissal.lastOfDay') : t('nextDismissal.next')}
              </p>
              <p className="text-lg font-bold leading-tight">
                {nextDismissal.bucket.time} ·{' '}
                <span className="text-muted-foreground font-medium">
                  {nextDismissal.whenLabel}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('nextDismissal.students', { count: nextDismissal.bucket.studentsCount })} ·{' '}
                {nextDismissal.bucket.levels.join(', ') || t('nextDismissal.mixed')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 max-w-md">
            {nextDismissal.bucket.gradeNames.slice(0, 8).map((g) => (
              <span
                key={g}
                className="inline-flex rounded-md bg-card border px-2 py-0.5 text-[11px] font-semibold"
              >
                {g}
              </span>
            ))}
            {nextDismissal.bucket.gradeNames.length > 8 && (
              <span className="text-[11px] text-muted-foreground self-center">
                +{nextDismissal.bucket.gradeNames.length - 8}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Horarios del día */}
      {dismissalBuckets.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-secondary/40 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {t('todaySchedule')}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-px bg-border">
            {dismissalBuckets.map((b) => {
              const info = timeUntil(b.time, t);
              const isNext = nextDismissal.bucket?.time === b.time && !nextDismissal.isPast;
              return (
                <div
                  key={b.time}
                  className={cn(
                    'p-3 bg-card',
                    isNext && 'bg-primary/5',
                    info.isPast && 'opacity-50',
                  )}
                >
                  <p className="text-base font-bold tabular-nums">{b.time}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                    {t('nextDismissal.students', { count: b.studentsCount })}
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground">
                    {info.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats: ventana GPS (en camino / en la puerta) + ventana padres afuera (sin GPS) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('stats.enRoute')}
          </p>
          <p className="mt-1 text-3xl font-bold">{enRoute}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('stats.atGate')}
          </p>
          <p className="mt-1 text-3xl font-bold text-amber-700">{inZone}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('stats.outsideNoGps')}
          </p>
          <p className="mt-1 text-3xl font-bold text-violet-700">{outside}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('stats.activePoints')}
          </p>
          <p className="mt-1 text-3xl font-bold">{pickupPoints.length}</p>
        </div>
      </div>

      {/* Filtros por pickup */}
      {pickupPoints.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
              filter === 'ALL'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground/70 hover:bg-secondary',
            )}
          >
            {tc('misc.all')} · {trips.length}
          </button>
          {pickupPoints.map((pp) => {
            const count = trips.filter((t) => t.pickupPointName === pp.name).length;
            const active = filter === pp.id || filter === pp.name;
            return (
              <button
                key={pp.id}
                type="button"
                onClick={() => setFilter(pp.name)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground/70 hover:bg-secondary',
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                {pp.name} · {count}
              </button>
            );
          })}
        </div>
      )}

      {/* Tabla en vivo */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {t('table.loadingTrips')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Radio className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-base font-semibold">{t('table.emptyTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('table.emptyHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-secondary/40">
                <tr className="text-left text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3 w-24">{t('table.eta')}</th>
                  <th className="px-4 py-3">{t('table.parentVehicle')}</th>
                  <th className="px-4 py-3">{t('table.students')}</th>
                  <th className="px-4 py-3">{t('table.point')}</th>
                  <th className="px-4 py-3">{tc('fields.status')}</th>
                  <th className="px-4 py-3 text-right">{tc('fields.actions')}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map((trip, idx) => {
                  const eta = etaColor(trip.etaSeconds, t);
                  const inZoneRow = trip.status === 'EN_ZONA';
                  return (
                    <tr
                      key={trip.id}
                      className={cn(
                        'border-b transition-colors hover:bg-secondary/40',
                        inZoneRow && 'bg-amber-50/40',
                      )}
                    >
                      <td className="px-4 py-3 align-middle">
                        <span className="text-base font-bold text-muted-foreground">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold',
                            eta.cls,
                          )}
                        >
                          {eta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <p className="font-semibold leading-tight">{trip.parentName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {trip.vehiclePlate ?? t('table.noVehicle')}
                          {trip.vehicleModel ? ` · ${trip.vehicleModel}` : ''}
                          {trip.vehicleColor ? ` · ${trip.vehicleColor}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {trip.studentNames.map((s) => (
                            <span
                              key={s}
                              className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <p className="text-xs font-medium leading-tight flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {trip.pickupPointName}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {relativeTime(trip.lastPositionAt, t)}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {inZoneRow && trip.origin && trip.origin !== 'EN_CAMINO' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1 text-xs font-bold text-violet-900 border border-violet-200">
                            <Circle className="h-2 w-2 fill-current animate-pulse" />
                            {trip.origin === 'WALKUP' ? t('badges.walkup') : t('badges.outside')}
                          </span>
                        ) : inZoneRow ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                            <Circle className="h-2 w-2 fill-current animate-pulse" />
                            {t('badges.atGate')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-900 border border-blue-200">
                            <Circle className="h-2 w-2 fill-current" />
                            {t('badges.onTheWay')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        {canFinalize && inZoneRow ? (
                          <button
                            type="button"
                            onClick={() => onFinalize(trip.id)}
                            disabled={finalizing === trip.id}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-95 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {finalizing === trip.id ? tc('actions.saving') : tc('actions.confirm')}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
