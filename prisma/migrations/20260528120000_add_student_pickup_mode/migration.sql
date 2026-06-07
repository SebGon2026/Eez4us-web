-- CreateEnum
CREATE TYPE "PickupMode" AS ENUM ('PRIVATE_VEHICLE', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "TransportVehicleType" AS ENUM ('BUS', 'VAN');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "pickupMode" "PickupMode" NOT NULL DEFAULT 'PRIVATE_VEHICLE',
ADD COLUMN     "transportName" TEXT,
ADD COLUMN     "transportPhone" TEXT,
ADD COLUMN     "transportPlate" TEXT,
ADD COLUMN     "transportVehicleType" "TransportVehicleType";
