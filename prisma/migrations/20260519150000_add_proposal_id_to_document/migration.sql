-- Add proposalId column to Document
ALTER TABLE "Document" ADD COLUMN "proposalId" TEXT;

-- Add index for tenantId + serviceId + proposalId queries
CREATE INDEX "Document_tenantId_serviceId_proposalId_idx" ON "Document"("tenantId", "serviceId", "proposalId");

-- Add foreign key constraint matching Contract's pattern
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_serviceId_proposalId_fkey"
  FOREIGN KEY ("tenantId", "serviceId", "proposalId")
  REFERENCES "Proposal"("tenantId", "serviceId", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
