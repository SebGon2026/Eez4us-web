-- AlterTable
ALTER TABLE "trip_students" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "finalizedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "trip_students_finalizedByUserId_idx" ON "trip_students"("finalizedByUserId");

-- AddForeignKey
ALTER TABLE "trip_students" ADD CONSTRAINT "trip_students_finalizedByUserId_fkey" FOREIGN KEY ("finalizedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
