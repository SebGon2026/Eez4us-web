'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';

import { useEncryptedChannel } from '@/lib/pusher-subscribe';
import type { RankedTrip } from '@/lib/trip-types';

import { TripCard } from './trip-card';

interface RankedTripsBoardProps {
  initialTrips: RankedTrip[];
  schoolId: string;
  pickupPointId: string;
  role: string;
}

function compareTrips(a: RankedTrip, b: RankedTrip): number {
  const ae = a.etaSeconds ?? Number.MAX_SAFE_INTEGER;
  const be = b.etaSeconds ?? Number.MAX_SAFE_INTEGER;
  if (ae !== be) return ae - be;
  return a.tripId.localeCompare(b.tripId);
}

interface TripUpdateData {
  tripId: string;
  status?: string;
  etaSeconds?: number | null;
  etaUpdatedAt?: string | null;
  lastLat?: number | null;
  lastLng?: number | null;
  arrivedAt?: string | null;
}

export function RankedTripsBoard({
  initialTrips,
  schoolId,
  pickupPointId,
  role,
}: RankedTripsBoardProps) {
  const [trips, setTrips] = useState<RankedTrip[]>(initialTrips);

  const channelName = useMemo(
    () => `private-encrypted-school-${schoolId}-pickup-${pickupPointId}`,
    [schoolId, pickupPointId],
  );

  const handleRanked = useCallback((data: unknown) => {
    const payload = data as { trips?: RankedTrip[] } | undefined;
    if (!payload?.trips) return;
    setTrips([...payload.trips].sort(compareTrips));
  }, []);

  const handleTripUpdate = useCallback((data: unknown) => {
    const update = data as TripUpdateData | undefined;
    if (!update?.tripId) return;
    setTrips((current) => {
      const idx = current.findIndex((t) => t.tripId === update.tripId);
      if (idx === -1) return current;
      const merged: RankedTrip = {
        ...current[idx],
        status: update.status ?? current[idx].status,
        etaSeconds: update.etaSeconds ?? current[idx].etaSeconds,
        etaUpdatedAt: update.etaUpdatedAt ?? current[idx].etaUpdatedAt,
        lastLat: update.lastLat ?? current[idx].lastLat,
        lastLng: update.lastLng ?? current[idx].lastLng,
        arrivedAt: update.arrivedAt ?? current[idx].arrivedAt,
      };
      const next = [...current];
      next[idx] = merged;
      next.sort(compareTrips);
      return next;
    });
  }, []);

  const handleTripRemoved = useCallback((data: unknown) => {
    const payload = data as { tripId?: string } | undefined;
    if (!payload?.tripId) return;
    setTrips((current) => current.filter((t) => t.tripId !== payload.tripId));
  }, []);

  const handleRemove = useCallback((tripId: string) => {
    setTrips((current) => current.filter((t) => t.tripId !== tripId));
  }, []);

  useEncryptedChannel(channelName, {
    'trips.ranked': handleRanked,
    'ranked-update': handleRanked,
    'trip.update': handleTripUpdate,
    'trip-update': handleTripUpdate,
    'trip-removed': handleTripRemoved,
  });

  if (trips.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-border bg-card py-16 text-center">
        <p className="text-lg font-bold text-muted-foreground">
          No hay viajes activos en este punto.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuando un padre presione &quot;voy en camino&quot; aparecerá acá.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      <AnimatePresence initial={false}>
        {trips.map((trip, idx) => (
          <motion.li
            key={trip.tripId}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <TripCard trip={trip} rank={idx + 1} role={role} onRemove={handleRemove} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
