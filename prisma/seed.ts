import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  ClientKind,
  DocumentVisibility,
  Prisma,
  PrismaClient,
  Role,
  ServiceStatus,
  ServiceType,
} from "@prisma/client";

const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

const connectionString = (() => {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error(
      "Missing required environment variable: DATABASE_URL. Check .env or your hosting environment configuration.",
    );
  }
  return value;
})();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-obraflow" },
    update: { name: "Demo ObraFlow" },
    create: {
      name: "Demo ObraFlow",
      slug: "demo-obraflow",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@obraflow.local" },
    update: { name: "Admin ObraFlow" },
    create: {
      name: "Admin ObraFlow",
      email: "admin@obraflow.local",
    },
  });

  await prisma.membership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: admin.id,
      },
    },
    update: { role: Role.ADMIN },
    create: {
      tenantId: tenant.id,
      userId: admin.id,
      role: Role.ADMIN,
    },
  });

  const client = await prisma.client.upsert({
    where: {
      tenantId_externalKey: {
        tenantId: tenant.id,
        externalKey: "demo-client-joao-silva",
      },
    },
    update: {
      externalKey: "demo-client-joao-silva",
      name: "Joao Silva",
      kind: ClientKind.PERSON,
      email: "joao.silva@obraflow.local",
      phone: "+55 63 99999-0000",
    },
    create: {
      tenantId: tenant.id,
      externalKey: "demo-client-joao-silva",
      name: "Joao Silva",
      kind: ClientKind.PERSON,
      email: "joao.silva@obraflow.local",
      phone: "+55 63 99999-0000",
    },
  });

  const property = await prisma.property.upsert({
    where: {
      tenantId_externalKey: {
        tenantId: tenant.id,
        externalKey: "demo-property-casa-pds",
      },
    },
    update: {
      externalKey: "demo-property-casa-pds",
      clientId: client.id,
      name: "Casa no Plano Diretor Sul",
      address: "Plano Diretor Sul",
      city: "Palmas",
      state: "TO",
    },
    create: {
      tenantId: tenant.id,
      externalKey: "demo-property-casa-pds",
      clientId: client.id,
      name: "Casa no Plano Diretor Sul",
      address: "Plano Diretor Sul",
      city: "Palmas",
      state: "TO",
    },
  });

  const service = await prisma.service.upsert({
    where: {
      tenantId_externalKey: {
        tenantId: tenant.id,
        externalKey: "demo-service-residence-project",
      },
    },
    update: {
      externalKey: "demo-service-residence-project",
      clientId: client.id,
      propertyId: property.id,
      title: "Projeto + aprovacao + execucao de residencia",
      type: ServiceType.PROJECT_APPROVAL_WORK,
      status: ServiceStatus.CONTRACTED,
    },
    create: {
      tenantId: tenant.id,
      externalKey: "demo-service-residence-project",
      clientId: client.id,
      propertyId: property.id,
      title: "Projeto + aprovacao + execucao de residencia",
      type: ServiceType.PROJECT_APPROVAL_WORK,
      status: ServiceStatus.CONTRACTED,
      description:
        "Projeto residencial com aprovacao nos orgaos competentes e acompanhamento de execucao.",
    },
  });

  await prisma.proposal.upsert({
    where: {
      tenantId_externalKey: {
        tenantId: tenant.id,
        externalKey: "demo-proposal-residence",
      },
    },
    update: {
      externalKey: "demo-proposal-residence",
      serviceId: service.id,
      title: "Proposta residencia Plano Diretor Sul",
      status: "ACCEPTED",
      totalAmount: new Prisma.Decimal("18500.00"),
    },
    create: {
      tenantId: tenant.id,
      externalKey: "demo-proposal-residence",
      serviceId: service.id,
      title: "Proposta residencia Plano Diretor Sul",
      status: "ACCEPTED",
      totalAmount: new Prisma.Decimal("18500.00"),
      sentAt: new Date("2026-05-01T12:00:00.000Z"),
      acceptedAt: new Date("2026-05-03T12:00:00.000Z"),
    },
  });

  const technicalPhase = await prisma.projectPhase.upsert({
    where: {
      tenantId_externalKey: {
        tenantId: tenant.id,
        externalKey: "demo-phase-technical-projects",
      },
    },
    update: {
      externalKey: "demo-phase-technical-projects",
      serviceId: service.id,
      name: "Projetos tecnicos",
      order: 1,
      status: ServiceStatus.PRODUCTION,
    },
    create: {
      tenantId: tenant.id,
      externalKey: "demo-phase-technical-projects",
      serviceId: service.id,
      name: "Projetos tecnicos",
      order: 1,
      status: ServiceStatus.PRODUCTION,
    },
  });

  const architectureTask = await prisma.serviceTask.upsert({
    where: {
      tenantId_externalKey: {
        tenantId: tenant.id,
        externalKey: "demo-task-architecture",
      },
    },
    update: {
      externalKey: "demo-task-architecture",
      serviceId: service.id,
      title: "Elaborar projeto arquitetonico executivo",
      status: ServiceStatus.PRODUCTION,
      assigneeId: admin.id,
      phaseId: technicalPhase.id,
    },
    create: {
      tenantId: tenant.id,
      externalKey: "demo-task-architecture",
      serviceId: service.id,
      assigneeId: admin.id,
      phaseId: technicalPhase.id,
      title: "Elaborar projeto arquitetonico executivo",
      status: ServiceStatus.PRODUCTION,
    },
  });

  await prisma.serviceTask.upsert({
    where: {
      tenantId_externalKey: {
        tenantId: tenant.id,
        externalKey: "demo-task-structure",
      },
    },
    update: {
      externalKey: "demo-task-structure",
      serviceId: service.id,
      title: "Compatibilizar projeto estrutural",
      status: ServiceStatus.PLANNING,
      assigneeId: admin.id,
      phaseId: technicalPhase.id,
    },
    create: {
      tenantId: tenant.id,
      externalKey: "demo-task-structure",
      serviceId: service.id,
      assigneeId: admin.id,
      phaseId: technicalPhase.id,
      title: "Compatibilizar projeto estrutural",
      status: ServiceStatus.PLANNING,
    },
  });

  await prisma.approvalProcess.upsert({
    where: {
      tenantId_externalKey: {
        tenantId: tenant.id,
        externalKey: "demo-approval-prefeitura",
      },
    },
    update: {
      externalKey: "demo-approval-prefeitura",
      serviceId: service.id,
      authority: "Prefeitura de Palmas",
      status: "IN_REVIEW",
      protocol: "PMP-2026-0001",
    },
    create: {
      tenantId: tenant.id,
      externalKey: "demo-approval-prefeitura",
      serviceId: service.id,
      authority: "Prefeitura de Palmas",
      protocol: "PMP-2026-0001",
      status: "IN_REVIEW",
    },
  });

  await prisma.workLog.upsert({
    where: {
      tenantId_externalKey: {
        tenantId: tenant.id,
        externalKey: "demo-worklog-initial-survey",
      },
    },
    update: {
      externalKey: "demo-worklog-initial-survey",
      serviceId: service.id,
      taskId: architectureTask.id,
      performedAt: new Date("2026-05-06T12:00:00.000Z"),
      summary: "Levantamento inicial em campo",
      hours: new Prisma.Decimal("3.50"),
    },
    create: {
      tenantId: tenant.id,
      externalKey: "demo-worklog-initial-survey",
      serviceId: service.id,
      taskId: architectureTask.id,
      performedAt: new Date("2026-05-06T12:00:00.000Z"),
      summary: "Levantamento inicial em campo",
      description: "Conferencia de medidas e registro fotografico do imovel.",
      hours: new Prisma.Decimal("3.50"),
    },
  });

  await prisma.document.upsert({
    where: {
      tenantId_externalKey: {
        tenantId: tenant.id,
        externalKey: "demo-document-approved-proposal",
      },
    },
    update: {
      externalKey: "demo-document-approved-proposal",
      serviceId: service.id,
      title: "Proposta aprovada",
      visibility: DocumentVisibility.CLIENT_VISIBLE,
      url: "https://example.com/obraflow/proposta-aprovada.pdf",
      mimeType: "application/pdf",
    },
    create: {
      tenantId: tenant.id,
      externalKey: "demo-document-approved-proposal",
      serviceId: service.id,
      title: "Proposta aprovada",
      url: "https://example.com/obraflow/proposta-aprovada.pdf",
      visibility: DocumentVisibility.CLIENT_VISIBLE,
      mimeType: "application/pdf",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
