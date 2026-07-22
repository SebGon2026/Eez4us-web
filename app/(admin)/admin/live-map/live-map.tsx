'use client';

import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';
import { Fragment, useCallback, useEffect, useState } from 'react';

import { usePoll } from '@/lib/use-poll';

const DEMO_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID';

interface PickupPoint {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

interface LiveTrip {
  id: string;
  parentName: string;
  studentNames: string[];
  pickupPointName: string;
  vehiclePlate: string;
  status: string;
  etaSeconds: number | null;
  lastLat: number | null;
  lastLng: number | null;
  lastPositionAt: string | null;
}

interface Props {
  center: { lat: number; lng: number };
  pickupPoints: PickupPoint[];
}

function GeofenceCircle({
  centerLat,
  centerLng,
  radiusMeters,
}: {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib) return;
    const circle = new mapsLib.Circle({
      center: { lat: centerLat, lng: centerLng },
      radius: radiusMeters,
      strokeColor: '#1d4ed8',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      clickable: false,
      map,
    });
    return () => circle.setMap(null);
  }, [map, mapsLib, centerLat, centerLng, radiusMeters]);

  return null;
}

export function LiveMap({ center, pickupPoints }: Props) {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const tNav = useTranslations('nav');
  const [trips, setTrips] = useState<LiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_WEB_KEY;

  const tick = useCallback(async () => {
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

  usePoll(tick, { activeMs: 5_000, idleMs: 60_000 });

  const tripsWithPosition = trips.filter((trip) => trip.lastLat != null && trip.lastLng != null);

  return (
    <div className="space-y-4">
      {apiKey?.startsWith('AIza') && !mapError ? (
        <div className="h-[480px] overflow-hidden rounded-2xl border">
          <APIProvider apiKey={apiKey} onError={() => setMapError(true)}>
            <Map
              defaultCenter={center}
              defaultZoom={14}
              mapId={DEMO_MAP_ID}
              gestureHandling="greedy"
              disableDefaultUI={false}
              className="h-full w-full"
            >
              {pickupPoints.map((pp) => (
                <Fragment key={pp.id}>
                  <AdvancedMarker position={{ lat: pp.centerLat, lng: pp.centerLng }}>
                    <div className="rounded-xl bg-primary px-2 py-1 text-xs font-bold text-primary-foreground shadow">
                      {pp.name}
                    </div>
                  </AdvancedMarker>
                  <GeofenceCircle
                    centerLat={pp.centerLat}
                    centerLng={pp.centerLng}
                    radiusMeters={pp.radiusMeters}
                  />
                </Fragment>
              ))}

              {tripsWithPosition.map((trip) => (
                <AdvancedMarker
                  key={trip.id}
                  position={{ lat: trip.lastLat as number, lng: trip.lastLng as number }}
                >
                  <div
                    className={
                      'rounded-full border-2 bg-white px-2 py-1 text-xs font-bold shadow ' +
                      (trip.status === 'EN_ZONA'
                        ? 'border-green-500 text-green-700'
                        : 'border-blue-500 text-blue-700')
                    }
                  >
                    {trip.etaSeconds != null
                      ? t('liveMap.minutes', { count: Math.round(trip.etaSeconds / 60) })
                      : trip.parentName.split(' ')[0]}
                  </div>
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
          <p className="font-bold">
            {t('liveMap.center', { lat: center.lat.toFixed(4), lng: center.lng.toFixed(4) })}
          </p>
          <p className="mt-1">{apiKey ? t('liveMap.loadError') : t('liveMap.missingKey')}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="font-bold mb-2 text-sm uppercase text-muted-foreground">
            {t('liveMap.pickupPointsHeading')}
          </h3>
          <ul className="space-y-2">
            {pickupPoints.map((pp) => (
              <li key={pp.id} className="rounded-2xl border bg-card p-3 text-sm">
                <p className="font-bold">{pp.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t('liveMap.pointMeta', {
                    lat: pp.centerLat.toFixed(5),
                    lng: pp.centerLng.toFixed(5),
                    radius: pp.radiusMeters,
                  })}
                </p>
              </li>
            ))}
            {pickupPoints.length === 0 && (
              <li className="text-xs text-muted-foreground">{t('liveMap.noPickupPoints')}</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-2 text-sm uppercase text-muted-foreground">
            {t('liveMap.liveVehiclesHeading', { count: trips.length })}
          </h3>
          {loading ? (
            <p className="text-xs text-muted-foreground">{tc('states.loading')}</p>
          ) : (
            <ul className="space-y-2">
              {trips.map((trip) => (
                <li key={trip.id} className="rounded-2xl border bg-card p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{trip.parentName}</p>
                    <span
                      className={
                        'rounded-full px-2 py-0.5 text-xs font-bold ' +
                        (trip.status === 'EN_ZONA'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800')
                      }
                    >
                      {trip.status === 'EN_CAMINO' ||
                      trip.status === 'EN_ZONA' ||
                      trip.status === 'ENTREGADO' ||
                      trip.status === 'CANCELADO'
                        ? tNav(`status.${trip.status}`)
                        : trip.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {trip.vehiclePlate} · {trip.studentNames.join(', ')}
                  </p>
                  {trip.etaSeconds != null && (
                    <p className="text-xs mt-1">
                      {t('liveMap.etaLabel')}{' '}
                      <span className="font-bold">
                        {t('liveMap.minutes', { count: Math.round(trip.etaSeconds / 60) })}
                      </span>
                    </p>
                  )}
                  {trip.lastLat != null && trip.lastLng != null && (
                    <p className="text-[10px] text-muted-foreground">
                      {trip.lastLat.toFixed(5)}, {trip.lastLng.toFixed(5)}
                    </p>
                  )}
                </li>
              ))}
              {trips.length === 0 && (
                <li className="text-xs text-muted-foreground">{t('liveMap.noOneOnTheWay')}</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
