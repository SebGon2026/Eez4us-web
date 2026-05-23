'use client';

import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';

import { Input } from '@/components/ui/input';

const DEMO_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID';

export interface AddressValue {
  addressText: string;
  addressLat: number | null;
  addressLng: number | null;
}

interface AddressPickerProps {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  placeholder?: string;
}

function AutocompleteInput({ value, onChange, placeholder }: AddressPickerProps) {
  const places = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement>(null);
  const map = useMap();

  useEffect(() => {
    if (!places || !inputRef.current) return;
    const ac = new places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry'],
    });
    const listener = ac.addListener('place_changed', () => {
      const p = ac.getPlace();
      const lat = p.geometry?.location?.lat();
      const lng = p.geometry?.location?.lng();
      if (lat === undefined || lng === undefined) return;
      onChange({
        addressText: p.formatted_address ?? inputRef.current?.value ?? '',
        addressLat: lat,
        addressLng: lng,
      });
      if (map) {
        map.panTo({ lat, lng });
        map.setZoom(16);
      }
    });
    return () => {
      listener.remove();
    };
  }, [places, onChange, map]);

  return (
    <Input
      ref={inputRef}
      defaultValue={value.addressText}
      placeholder={placeholder ?? 'Buscar dirección'}
      onChange={(e) => onChange({ ...value, addressText: e.target.value })}
    />
  );
}

function PreviewMap({ value }: { value: AddressValue }) {
  if (value.addressLat === null || value.addressLng === null) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border-2 border-dashed text-xs text-muted-foreground">
        Buscá una dirección para ver el mapa.
      </div>
    );
  }
  return (
    <div className="h-40 overflow-hidden rounded-2xl border">
      <Map
        center={{ lat: value.addressLat, lng: value.addressLng }}
        zoom={15}
        mapId={DEMO_MAP_ID}
        gestureHandling="cooperative"
        disableDefaultUI
      />
    </div>
  );
}

export function AddressPicker({ value, onChange, placeholder }: AddressPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_WEB_KEY;
  if (!apiKey) {
    return (
      <Input
        value={value.addressText}
        onChange={(e) => onChange({ ...value, addressText: e.target.value })}
        placeholder={placeholder ?? 'Dirección'}
      />
    );
  }
  return (
    <APIProvider apiKey={apiKey} libraries={['places']}>
      <div className="space-y-3">
        <AutocompleteInput value={value} onChange={onChange} placeholder={placeholder} />
        <PreviewMap value={value} />
      </div>
    </APIProvider>
  );
}
