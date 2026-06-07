-- AlterTable
ALTER TABLE "trips" ALTER COLUMN "vehicleId" DROP NOT NULL;
ALTER TABLE "trips" ADD COLUMN     "isWalkup" BOOLEAN NOT NULL DEFAULT false;
