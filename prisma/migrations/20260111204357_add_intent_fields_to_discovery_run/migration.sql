-- AlterTable
ALTER TABLE "discovery_runs" ADD COLUMN     "intentId" TEXT,
ADD COLUMN     "intentName" TEXT,
ADD COLUMN     "triggeredById" TEXT;

-- CreateIndex
CREATE INDEX "discovery_runs_intentId_idx" ON "discovery_runs"("intentId");
