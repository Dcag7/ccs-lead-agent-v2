-- CreateTable
CREATE TABLE "discovery_runs" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mode" TEXT NOT NULL DEFAULT 'daily',
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "triggeredBy" TEXT,
    "stats" JSONB,
    "error" TEXT,
    "createdCompaniesCount" INTEGER NOT NULL DEFAULT 0,
    "createdContactsCount" INTEGER NOT NULL DEFAULT 0,
    "createdLeadsCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discovery_runs_status_idx" ON "discovery_runs"("status");

-- CreateIndex
CREATE INDEX "discovery_runs_startedAt_idx" ON "discovery_runs"("startedAt");

-- CreateIndex
CREATE INDEX "discovery_runs_mode_idx" ON "discovery_runs"("mode");
