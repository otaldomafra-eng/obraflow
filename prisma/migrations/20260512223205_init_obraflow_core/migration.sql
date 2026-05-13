-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'INTERNAL_TEAM', 'COMMERCIAL', 'TECHNICIAN', 'FIELD', 'SUPPLIER', 'CLIENT');

-- CreateEnum
CREATE TYPE "ClientKind" AS ENUM ('PERSON', 'COMPANY');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('NEW', 'PROPOSAL', 'AWAITING_ACCEPTANCE', 'CONTRACTED', 'PLANNING', 'PRODUCTION', 'APPROVAL', 'WORK', 'AWAITING_CLIENT', 'PAUSED', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('TECHNICAL_PROJECT', 'REGULARIZATION', 'WORK_EXECUTION', 'CONSULTING', 'FIRE_SAFETY', 'PROJECT_APPROVAL_WORK');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('INTERNAL', 'CLIENT_VISIBLE', 'SUPPLIER_VISIBLE');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "name" TEXT NOT NULL,
    "kind" "ClientKind" NOT NULL DEFAULT 'PERSON',
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "clientId" TEXT NOT NULL,
    "propertyId" TEXT,
    "title" TEXT NOT NULL,
    "type" "ServiceType" NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'NEW',
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "clientId" TEXT,
    "serviceId" TEXT,
    "source" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "clientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'QUALIFICATION',
    "value" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "serviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL(12,2),
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "serviceId" TEXT NOT NULL,
    "proposalId" TEXT,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPhase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ServiceStatus" NOT NULL DEFAULT 'PLANNING',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "serviceId" TEXT NOT NULL,
    "phaseId" TEXT,
    "assigneeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ServiceStatus" NOT NULL DEFAULT 'PLANNING',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalProcess" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "serviceId" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "protocol" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "serviceId" TEXT NOT NULL,
    "taskId" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkMeasurement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "serviceId" TEXT NOT NULL,
    "taskId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "serviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "serviceId" TEXT NOT NULL,
    "clientId" TEXT,
    "userId" TEXT,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'PORTAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "serviceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiInteraction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalKey" TEXT,
    "serviceId" TEXT NOT NULL,
    "userId" TEXT,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_tenantId_userId_key" ON "Membership"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Client_tenantId_idx" ON "Client"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_tenantId_id_key" ON "Client"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Client_tenantId_externalKey_key" ON "Client"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "Property_tenantId_clientId_idx" ON "Property"("tenantId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Property_tenantId_id_key" ON "Property"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Property_tenantId_clientId_id_key" ON "Property"("tenantId", "clientId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Property_tenantId_externalKey_key" ON "Property"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "Service_tenantId_idx" ON "Service"("tenantId");

-- CreateIndex
CREATE INDEX "Service_tenantId_clientId_idx" ON "Service"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "Service_tenantId_clientId_propertyId_idx" ON "Service"("tenantId", "clientId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_tenantId_id_key" ON "Service"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Service_tenantId_clientId_id_key" ON "Service"("tenantId", "clientId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Service_tenantId_externalKey_key" ON "Service"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "Lead_tenantId_clientId_idx" ON "Lead"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "Lead_tenantId_serviceId_idx" ON "Lead"("tenantId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_tenantId_id_key" ON "Lead"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_tenantId_externalKey_key" ON "Lead"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "Opportunity_tenantId_clientId_idx" ON "Opportunity"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "Opportunity_tenantId_clientId_serviceId_idx" ON "Opportunity"("tenantId", "clientId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_tenantId_id_key" ON "Opportunity"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_tenantId_externalKey_key" ON "Opportunity"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "Proposal_tenantId_serviceId_idx" ON "Proposal"("tenantId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_tenantId_id_key" ON "Proposal"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_tenantId_serviceId_id_key" ON "Proposal"("tenantId", "serviceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_tenantId_externalKey_key" ON "Proposal"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "Contract_tenantId_serviceId_idx" ON "Contract"("tenantId", "serviceId");

-- CreateIndex
CREATE INDEX "Contract_tenantId_serviceId_proposalId_idx" ON "Contract"("tenantId", "serviceId", "proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_tenantId_id_key" ON "Contract"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_tenantId_number_key" ON "Contract"("tenantId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_tenantId_externalKey_key" ON "Contract"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "ProjectPhase_tenantId_serviceId_idx" ON "ProjectPhase"("tenantId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPhase_tenantId_id_key" ON "ProjectPhase"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPhase_tenantId_serviceId_id_key" ON "ProjectPhase"("tenantId", "serviceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPhase_tenantId_externalKey_key" ON "ProjectPhase"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "ServiceTask_tenantId_serviceId_idx" ON "ServiceTask"("tenantId", "serviceId");

-- CreateIndex
CREATE INDEX "ServiceTask_tenantId_serviceId_phaseId_idx" ON "ServiceTask"("tenantId", "serviceId", "phaseId");

-- CreateIndex
CREATE INDEX "ServiceTask_assigneeId_idx" ON "ServiceTask"("assigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTask_tenantId_id_key" ON "ServiceTask"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTask_tenantId_serviceId_id_key" ON "ServiceTask"("tenantId", "serviceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTask_tenantId_externalKey_key" ON "ServiceTask"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "ApprovalProcess_tenantId_serviceId_idx" ON "ApprovalProcess"("tenantId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalProcess_tenantId_id_key" ON "ApprovalProcess"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalProcess_tenantId_externalKey_key" ON "ApprovalProcess"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "WorkLog_tenantId_serviceId_idx" ON "WorkLog"("tenantId", "serviceId");

-- CreateIndex
CREATE INDEX "WorkLog_tenantId_serviceId_taskId_idx" ON "WorkLog"("tenantId", "serviceId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkLog_tenantId_id_key" ON "WorkLog"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkLog_tenantId_externalKey_key" ON "WorkLog"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "WorkMeasurement_tenantId_serviceId_idx" ON "WorkMeasurement"("tenantId", "serviceId");

-- CreateIndex
CREATE INDEX "WorkMeasurement_tenantId_serviceId_taskId_idx" ON "WorkMeasurement"("tenantId", "serviceId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkMeasurement_tenantId_id_key" ON "WorkMeasurement"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkMeasurement_tenantId_externalKey_key" ON "WorkMeasurement"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "Document_tenantId_serviceId_idx" ON "Document"("tenantId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_tenantId_id_key" ON "Document"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Document_tenantId_externalKey_key" ON "Document"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "Message_tenantId_serviceId_idx" ON "Message"("tenantId", "serviceId");

-- CreateIndex
CREATE INDEX "Message_tenantId_clientId_idx" ON "Message"("tenantId", "clientId");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_tenantId_id_key" ON "Message"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Message_tenantId_externalKey_key" ON "Message"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "TimelineEvent_tenantId_serviceId_idx" ON "TimelineEvent"("tenantId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_tenantId_id_key" ON "TimelineEvent"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_tenantId_externalKey_key" ON "TimelineEvent"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "AiInteraction_tenantId_serviceId_idx" ON "AiInteraction"("tenantId", "serviceId");

-- CreateIndex
CREATE INDEX "AiInteraction_userId_idx" ON "AiInteraction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AiInteraction_tenantId_id_key" ON "AiInteraction"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AiInteraction_tenantId_externalKey_key" ON "AiInteraction"("tenantId", "externalKey");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_tenantId_clientId_fkey" FOREIGN KEY ("tenantId", "clientId") REFERENCES "Client"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_clientId_fkey" FOREIGN KEY ("tenantId", "clientId") REFERENCES "Client"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_clientId_propertyId_fkey" FOREIGN KEY ("tenantId", "clientId", "propertyId") REFERENCES "Property"("tenantId", "clientId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_clientId_fkey" FOREIGN KEY ("tenantId", "clientId") REFERENCES "Client"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_tenantId_clientId_fkey" FOREIGN KEY ("tenantId", "clientId") REFERENCES "Client"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_tenantId_clientId_serviceId_fkey" FOREIGN KEY ("tenantId", "clientId", "serviceId") REFERENCES "Service"("tenantId", "clientId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_tenantId_serviceId_proposalId_fkey" FOREIGN KEY ("tenantId", "serviceId", "proposalId") REFERENCES "Proposal"("tenantId", "serviceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPhase" ADD CONSTRAINT "ProjectPhase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPhase" ADD CONSTRAINT "ProjectPhase_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTask" ADD CONSTRAINT "ServiceTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTask" ADD CONSTRAINT "ServiceTask_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTask" ADD CONSTRAINT "ServiceTask_tenantId_serviceId_phaseId_fkey" FOREIGN KEY ("tenantId", "serviceId", "phaseId") REFERENCES "ProjectPhase"("tenantId", "serviceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTask" ADD CONSTRAINT "ServiceTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalProcess" ADD CONSTRAINT "ApprovalProcess_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalProcess" ADD CONSTRAINT "ApprovalProcess_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_tenantId_serviceId_taskId_fkey" FOREIGN KEY ("tenantId", "serviceId", "taskId") REFERENCES "ServiceTask"("tenantId", "serviceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkMeasurement" ADD CONSTRAINT "WorkMeasurement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkMeasurement" ADD CONSTRAINT "WorkMeasurement_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkMeasurement" ADD CONSTRAINT "WorkMeasurement_tenantId_serviceId_taskId_fkey" FOREIGN KEY ("tenantId", "serviceId", "taskId") REFERENCES "ServiceTask"("tenantId", "serviceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_tenantId_clientId_fkey" FOREIGN KEY ("tenantId", "clientId") REFERENCES "Client"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInteraction" ADD CONSTRAINT "AiInteraction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInteraction" ADD CONSTRAINT "AiInteraction_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "Service"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInteraction" ADD CONSTRAINT "AiInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

