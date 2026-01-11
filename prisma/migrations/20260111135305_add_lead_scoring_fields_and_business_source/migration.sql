-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "businessSource" TEXT,
ADD COLUMN     "classification" TEXT,
ADD COLUMN     "scoredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "leads_businessSource_idx" ON "leads"("businessSource");
