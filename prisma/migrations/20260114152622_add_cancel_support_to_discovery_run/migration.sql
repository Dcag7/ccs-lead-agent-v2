-- AlterTable
ALTER TABLE "discovery_runs" ADD COLUMN     "cancelRequestedAt" TIMESTAMP(3),
ADD COLUMN     "cancelRequestedBy" TEXT;
