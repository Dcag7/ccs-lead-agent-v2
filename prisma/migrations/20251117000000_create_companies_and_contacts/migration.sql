-- CreateTable
-- Create companies table with all required columns including enrichment and discovery metadata fields
CREATE TABLE IF NOT EXISTS "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "country" TEXT,
    "size" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "scoreFactors" JSONB,
    "enrichmentStatus" TEXT,
    "enrichmentLastRun" TIMESTAMP(3),
    "enrichmentData" JSONB,
    "discoveryMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- Create contacts table with all required columns including discovery metadata fields
CREATE TABLE IF NOT EXISTS "contacts" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "companyId" TEXT,
    "linkedInUrl" TEXT,
    "discoveryMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contacts_linkedInUrl_idx" ON "contacts"("linkedInUrl");

-- AddForeignKey
-- Add foreign key constraint from contacts to companies
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') 
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints 
       WHERE constraint_schema = 'public' 
       AND constraint_name = 'contacts_companyId_fkey'
       AND table_name = 'contacts'
     ) THEN
    ALTER TABLE "contacts" ADD CONSTRAINT "contacts_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
