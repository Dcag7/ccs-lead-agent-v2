-- AlterTable
ALTER TABLE "discovery_runs" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedById" TEXT;

-- CreateIndex
CREATE INDEX "discovery_runs_archivedAt_idx" ON "discovery_runs"("archivedAt");
