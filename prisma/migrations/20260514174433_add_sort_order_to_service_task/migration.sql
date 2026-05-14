-- DropForeignKey
ALTER TABLE "AiInteraction" DROP CONSTRAINT "AiInteraction_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_userId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceTask" DROP CONSTRAINT "ServiceTask_assigneeId_fkey";

-- DropIndex
DROP INDEX "AiInteraction_userId_idx";

-- DropIndex
DROP INDEX "Message_userId_idx";

-- DropIndex
DROP INDEX "ServiceTask_assigneeId_idx";

-- AlterTable
ALTER TABLE "ServiceTask" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "AiInteraction_tenantId_userId_idx" ON "AiInteraction"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Membership_tenantId_userId_idx" ON "Membership"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Message_tenantId_userId_idx" ON "Message"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "ServiceTask_tenantId_assigneeId_idx" ON "ServiceTask"("tenantId", "assigneeId");

-- AddForeignKey
ALTER TABLE "ServiceTask" ADD CONSTRAINT "ServiceTask_tenantId_assigneeId_fkey" FOREIGN KEY ("tenantId", "assigneeId") REFERENCES "Membership"("tenantId", "userId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "Membership"("tenantId", "userId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInteraction" ADD CONSTRAINT "AiInteraction_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "Membership"("tenantId", "userId") ON DELETE NO ACTION ON UPDATE CASCADE;
