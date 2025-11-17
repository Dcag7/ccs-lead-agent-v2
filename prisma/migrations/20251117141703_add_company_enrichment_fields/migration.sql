-- AlterTable
-- Add enrichment fields to companies table for Phase 6 Google CSE integration
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "enrichmentData" JSONB,
ADD COLUMN IF NOT EXISTS "enrichmentLastRun" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "enrichmentStatus" TEXT;
