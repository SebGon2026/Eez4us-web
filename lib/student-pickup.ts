import { z } from 'zod';

export const pickupModeEnum = z.enum(['PRIVATE_VEHICLE', 'TRANSPORT', 'WALKING']);
export const transportVehicleTypeEnum = z.enum(['BUS', 'VAN']);

const nullableTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null));

export const pickupFields = {
  pickupMode: pickupModeEnum.optional(),
  transportName: nullableTrimmed(120),
  transportPlate: nullableTrimmed(20),
  transportPhone: nullableTrimmed(20),
  transportVehicleType: transportVehicleTypeEnum.nullable().optional(),
} as const;

export type PickupModeValue = 'PRIVATE_VEHICLE' | 'TRANSPORT' | 'WALKING';

export interface PickupInput {
  pickupMode?: PickupModeValue;
  transportName?: string | null;
  transportPlate?: string | null;
  transportPhone?: string | null;
  transportVehicleType?: 'BUS' | 'VAN' | null;
}

export interface NormalizedPickup {
  pickupMode: PickupModeValue;
  transportName: string | null;
  transportPlate: string | null;
  transportPhone: string | null;
  transportVehicleType: 'BUS' | 'VAN' | null;
}

export type NormalizePickupResult =
  | { ok: true; value: NormalizedPickup }
  | { ok: false; error: string };

export function normalizePickup(
  input: PickupInput,
  fallbackMode: PickupModeValue = 'PRIVATE_VEHICLE',
): NormalizePickupResult {
  const mode = input.pickupMode ?? fallbackMode;
  if (mode === 'TRANSPORT') {
    if (!input.transportName || !input.transportPlate || !input.transportVehicleType) {
      return { ok: false, error: 'TRANSPORT_DETAILS_REQUIRED' };
    }
    return {
      ok: true,
      value: {
        pickupMode: 'TRANSPORT',
        transportName: input.transportName,
        transportPlate: input.transportPlate,
        transportPhone: input.transportPhone ?? null,
        transportVehicleType: input.transportVehicleType,
      },
    };
  }
  // PRIVATE_VEHICLE y WALKING no llevan datos de transporte. WALKING = el padre
  // recoge a pie: sin vehículo ni placa, opera por "estoy afuera" en el mobile.
  return {
    ok: true,
    value: {
      pickupMode: mode,
      transportName: null,
      transportPlate: null,
      transportPhone: null,
      transportVehicleType: null,
    },
  };
}
