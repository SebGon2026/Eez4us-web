export interface RankedTrip {
  tripId: string;
  parentId: string;
  parentName: string | null;
  vehicle: { plate: string; model: string; color: string };
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
}
