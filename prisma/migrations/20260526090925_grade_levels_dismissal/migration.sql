-- AlterTable
ALTER TABLE "grades" ADD COLUMN     "dismissalTime" TEXT,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "grades_schoolId_dismissalTime_idx" ON "grades"("schoolId", "dismissalTime");
