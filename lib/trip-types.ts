export interface RankedTrip {
  tripId: string;
  parentId: string;
  parentName: string | null;
  vehicle: { plate: string; model: string; color: string } | null; // null = walk-up (sin vehículo)
  isWalkup: boolean;
  // EN_CAMINO = GPS+ETA · ESTOY_AFUERA = padre en puerta sin GPS · WALKUP = creado en portón
  origin: 'EN_CAMINO' | 'ESTOY_AFUERA' | 'WALKUP';
  students: Array<{ id: string; firstName: string; lastName: string }>;
  status: string;
  etaSeconds: number | null;
  etaUpdatedAt: string | null;
  lastLat: number | null;
  lastLng: number | null;
  arrivedAt: string | null;
}

export interface TripUpdatePayload {
  tripId: string;
  status: string;
  etaSeconds: number | null;
  etaUpdatedAt: string | null;
  lastLat: number | null;
  lastLng: number | null;
  arrivedAt: string | null;
  lastPositionAt: string | null;
}

export type RosterProximity = 'EN_CAMINO' | 'CERCA' | 'EN_PUERTA';

export interface RosterEntry {
  tripId: string;
  // Cómo arrancó la recogida (mismo enum que Trip.origin). Opcional para no romper
  // el contrato previo del mobile.
  origin?: 'EN_CAMINO' | 'ESTOY_AFUERA' | 'WALKUP';
  student: {
    id: string;
    firstName: string;
    lastName: string;
    grade: { id: string; name: string } | null;
  };
  pickupBy: {
    // 'walkup' = recogida en puerta sin viaje del padre (§A7-ter): la identidad del que
    // recoge no la conoce el sistema; la valida visualmente la miss.
    kind: 'parent' | 'authorized-family' | 'temporary-auth' | 'walkup';
    name: string;
    relationship?: string | null;
  };
  vehicle: { plate: string; model: string; color: string } | null;
  etaSeconds: number | null;
  // Frescura de la telemetría: si lastPositionAt quedó viejo (teléfono muerto, OEM mató
  // el tracking) el cliente pinta "sin señal" en vez de un ETA congelado. Opcionales
  // para no romper el contrato previo del mobile. Null en walk-up / estoy afuera.
  etaUpdatedAt?: string | null;
  lastPositionAt?: string | null;
  proximity: RosterProximity;
  atGate: boolean;
}
