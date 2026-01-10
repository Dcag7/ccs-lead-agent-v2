-- AlterTable
-- Add discovery metadata fields for Phase 1 Discovery MVP
ALTER TABLE IF EXISTS "companies" ADD COLUMN IF NOT EXISTS "discoveryMetadata" JSONB;

-- AlterTable
-- Make email optional and add discovery fields to contacts
ALTER TABLE IF EXISTS "contacts" ALTER COLUMN "email" DROP NOT NULL,
ADD COLUMN IF NOT EXISTS "linkedInUrl" TEXT,
ADD COLUMN IF NOT EXISTS "discoveryMetadata" JSONB;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contacts_linkedInUrl_idx" ON "contacts"("linkedInUrl");

-- AlterTable
-- Add discovery metadata field to leads
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "discoveryMetadata" JSONB;
