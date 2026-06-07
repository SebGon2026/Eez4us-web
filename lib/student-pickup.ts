import { z } from 'zod';

export const pickupModeEnum = z.enum(['PRIVATE_VEHICLE', 'TRANSPORT']);
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

export interface PickupInput {
  pickupMode?: 'PRIVATE_VEHICLE' | 'TRANSPORT';
  transportName?: string | null;
  transportPlate?: string | null;
  transportPhone?: string | null;
  transportVehicleType?: 'BUS' | 'VAN' | null;
}

export interface NormalizedPickup {
  pickupMode: 'PRIVATE_VEHICLE' | 'TRANSPORT';
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
  fallbackMode: 'PRIVATE_VEHICLE' | 'TRANSPORT' = 'PRIVATE_VEHICLE',
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
  return {
    ok: true,
    value: {
      pickupMode: 'PRIVATE_VEHICLE',
      transportName: null,
      transportPlate: null,
      transportPhone: null,
      transportVehicleType: null,
    },
  };
}
