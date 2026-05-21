-- AlterTable
ALTER TABLE "Service" ADD COLUMN "artNumber" TEXT;
ALTER TABLE "Service" ADD COLUMN "technicalLead" TEXT;
ALTER TABLE "Service" ADD COLUMN "councilRegNumber" TEXT;
ALTER TABLE "Service" ADD COLUMN "internalCode" TEXT;
ALTER TABLE "Service" ADD COLUMN "portalToken" TEXT;
ALTER TABLE "Service" ADD COLUMN "portalEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Service_portalToken_key" ON "Service"("portalToken");
