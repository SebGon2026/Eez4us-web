-- CreateIndex
CREATE INDEX "trips_parentId_status_idx" ON "trips"("parentId", "status");
