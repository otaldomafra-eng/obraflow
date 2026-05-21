-- AlterTable
ALTER TABLE "Document" ADD COLUMN "storagePath" TEXT;
ALTER TABLE "Document" ADD COLUMN "fileName" TEXT;
ALTER TABLE "Document" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "Document" ADD COLUMN "uploadedAt" TIMESTAMP(3);
