'use client';

import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

const DEMO_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID';

const EARTH_RADIUS_M = 6378137;

function circlePoints(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  steps = 64,
): Array<{ lat: number; lng: number }> {
  const lat1 = (centerLat * Math.PI) / 180;
  const lng1 = (centerLng * Math.PI) / 180;
  const angular = radiusMeters / EARTH_RADIUS_M;
  const pts: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i <= steps; i++) {
    const bearing = (2 * Math.PI * i) / steps;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angular) +
        Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
        Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
      );
    pts.push({ lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI });
  }
  return pts;
}

interface CircleOverlayProps {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

function CircleOverlay({ centerLat, centerLng, radiusMeters }: CircleOverlayProps) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  const path = useMemo(
    () => circlePoints(centerLat, centerLng, radiusMeters),
    [centerLat, centerLng, radiusMeters],
  );

  useEffect(() => {
    if (!map || !mapsLib) return;
    const polygon = new mapsLib.Polygon({
      paths: path,
      strokeColor: '#1d4ed8',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.18,
      clickable: false,
      map,
    });
    return () => polygon.setMap(null);
  }, [map, mapsLib, path]);

  return null;
}

export interface PickupPointMapValue {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

interface PickupPointMapProps {
  value: PickupPointMapValue;
  onChange: (value: PickupPointMapValue) => void;
  className?: string;
}

function MapBody({ value, onChange }: PickupPointMapProps) {
  return (
    <>
      <Map
        defaultCenter={{ lat: value.centerLat, lng: value.centerLng }}
        defaultZoom={17}
        mapId={DEMO_MAP_ID}
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="h-full w-full"
      >
        <AdvancedMarker
          position={{ lat: value.centerLat, lng: value.centerLng }}
          draggable
          onDragEnd={(e) => {
            if (!e.latLng) return;
            onChange({
              ...value,
              centerLat: e.latLng.lat(),
              centerLng: e.latLng.lng(),
            });
          }}
        />
        <CircleOverlay
          centerLat={value.centerLat}
          centerLng={value.centerLng}
          radiusMeters={value.radiusMeters}
        />
      </Map>
    </>
  );
}

export function PickupPointMap({ value, onChange, className }: PickupPointMapProps) {
  const t = useTranslations('pickupPoints');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_WEB_KEY;
  const [hasError, setHasError] = useState(false);

  if (!apiKey) {
    return (
      <div className={className}>
        <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed text-sm text-muted-foreground">
          {t('map.missingKey')}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="h-full overflow-hidden rounded-2xl border">
        <APIProvider apiKey={apiKey} onError={() => setHasError(true)}>
          {hasError ? (
            <div className="flex h-full items-center justify-center text-sm text-destructive">
              {t('map.loadError')}
            </div>
          ) : (
            <MapBody value={value} onChange={onChange} />
          )}
        </APIProvider>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm font-bold">
          <span>{t('map.geofenceRadius')}</span>
          <span className="text-primary">{value.radiusMeters} m</span>
        </div>
        <input
          type="range"
          min={50}
          max={500}
          step={5}
          value={value.radiusMeters}
          onChange={(e) =>
            onChange({ ...value, radiusMeters: Number(e.target.value) })
          }
          className="w-full accent-primary"
        />
        <p className="text-xs text-muted-foreground">{t('map.dragHint')}</p>
      </div>
    </div>
  );
}
