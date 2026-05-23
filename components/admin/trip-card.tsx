'use client';

import type { RankedTrip } from '@/lib/trip-types';
import { cn } from '@/lib/utils';

import { FinalizeButton } from './finalize-button';
import { StatusBadge } from './status-badge';
import { TripETA } from './trip-eta';

const STAFF_ROLES = new Set(['director', 'support_staff', 'super_admin']);

interface TripCardProps {
  trip: RankedTrip;
  rank: number;
  role: string;
  onRemove: (tripId: string) => void;
}

export function TripCard({ trip, rank, role, onRemove }: TripCardProps) {
  const inZone = trip.status === 'EN_ZONA';
  const canFinalize = inZone && STAFF_ROLES.has(role);

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-md transition-shadow hover:shadow-lg',
        inZone && 'animate-pulse border-amber-400',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black text-primary">#{rank}</span>
          <div>
            <p className="text-lg font-bold leading-tight">
              {trip.parentName ?? 'Padre sin nombre'}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-flex h-5 w-5 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: trip.vehicle.color }}
                title={trip.vehicle.color}
                aria-hidden
              />
              <span className="font-mono text-sm font-bold tracking-wide">
                {trip.vehicle.plate}
              </span>
              <span className="text-xs text-muted-foreground">{trip.vehicle.model}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <TripETA etaSeconds={trip.etaSeconds} etaUpdatedAt={trip.etaUpdatedAt} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {trip.students.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-bold"
          >
            {s.firstName} {s.lastName}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <StatusBadge status={trip.status} />
        {canFinalize && (
          <FinalizeButton
            tripId={trip.tripId}
            parentName={trip.parentName ?? 'el padre'}
            studentNames={trip.students.map((s) => `${s.firstName} ${s.lastName}`)}
            onRemove={() => onRemove(trip.tripId)}
          />
        )}
      </div>
    </div>
  );
}
