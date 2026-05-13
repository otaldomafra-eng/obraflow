import {
  ClientKind,
  DocumentVisibility,
  Prisma,
  PrismaClient,
  Role,
  ServiceStatus,
  ServiceType,
} from "@prisma/client";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function createPrismaClient() {
  try {
    const { PrismaPg } = require("@prisma/adapter-pg") as {
      PrismaPg: new (config: { connectionString: string }) => unknown;
    };

    return new PrismaClient({
      adapter: new PrismaPg({
        connectionString:
          process.env.DATABASE_URL ??
          "postgresql://obraflow:obraflow@localhost:5432/obraflow",
      }),
    } as ConstructorParameters<typeof PrismaClient>[0]);
  } catch {
    throw new Error(
      "Prisma 7 requires @prisma/adapter-pg to run the seed against PostgreSQL.",
    );
  }
}

const prisma = createPrismaClient();

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
      tenantId_email: {
        tenantId: tenant.id,
        email: "joao.silva@obraflow.local",
      },
    },
    update: {
      name: "Joao Silva",
      kind: ClientKind.PERSON,
      phone: "+55 63 99999-0000",
    },
    create: {
      tenantId: tenant.id,
      name: "Joao Silva",
      kind: ClientKind.PERSON,
      email: "joao.silva@obraflow.local",
      phone: "+55 63 99999-0000",
    },
  });

  const property = await prisma.property.upsert({
    where: {
      tenantId_clientId_name: {
        tenantId: tenant.id,
        clientId: client.id,
        name: "Casa no Plano Diretor Sul",
      },
    },
    update: {
      address: "Plano Diretor Sul",
      city: "Palmas",
      state: "TO",
    },
    create: {
      tenantId: tenant.id,
      clientId: client.id,
      name: "Casa no Plano Diretor Sul",
      address: "Plano Diretor Sul",
      city: "Palmas",
      state: "TO",
    },
  });

  const service = await prisma.service.upsert({
    where: {
      tenantId_clientId_title: {
        tenantId: tenant.id,
        clientId: client.id,
        title: "Projeto + aprovacao + execucao de residencia",
      },
    },
    update: {
      propertyId: property.id,
      type: ServiceType.PROJECT_APPROVAL_WORK,
      status: ServiceStatus.CONTRACTED,
    },
    create: {
      tenantId: tenant.id,
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
      tenantId_serviceId_title: {
        tenantId: tenant.id,
        serviceId: service.id,
        title: "Proposta residencia Plano Diretor Sul",
      },
    },
    update: {
      status: "ACCEPTED",
      totalAmount: new Prisma.Decimal("18500.00"),
    },
    create: {
      tenantId: tenant.id,
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
      tenantId_serviceId_name: {
        tenantId: tenant.id,
        serviceId: service.id,
        name: "Projetos tecnicos",
      },
    },
    update: {
      order: 1,
      status: ServiceStatus.PRODUCTION,
    },
    create: {
      tenantId: tenant.id,
      serviceId: service.id,
      name: "Projetos tecnicos",
      order: 1,
      status: ServiceStatus.PRODUCTION,
    },
  });

  const architectureTask = await prisma.serviceTask.upsert({
    where: {
      tenantId_serviceId_title: {
        tenantId: tenant.id,
        serviceId: service.id,
        title: "Elaborar projeto arquitetonico executivo",
      },
    },
    update: {
      status: ServiceStatus.PRODUCTION,
      assigneeId: admin.id,
      phaseId: technicalPhase.id,
    },
    create: {
      tenantId: tenant.id,
      serviceId: service.id,
      assigneeId: admin.id,
      phaseId: technicalPhase.id,
      title: "Elaborar projeto arquitetonico executivo",
      status: ServiceStatus.PRODUCTION,
    },
  });

  await prisma.serviceTask.upsert({
    where: {
      tenantId_serviceId_title: {
        tenantId: tenant.id,
        serviceId: service.id,
        title: "Compatibilizar projeto estrutural",
      },
    },
    update: {
      status: ServiceStatus.PLANNING,
      assigneeId: admin.id,
      phaseId: technicalPhase.id,
    },
    create: {
      tenantId: tenant.id,
      serviceId: service.id,
      assigneeId: admin.id,
      phaseId: technicalPhase.id,
      title: "Compatibilizar projeto estrutural",
      status: ServiceStatus.PLANNING,
    },
  });

  await prisma.approvalProcess.upsert({
    where: {
      tenantId_serviceId_authority: {
        tenantId: tenant.id,
        serviceId: service.id,
        authority: "Prefeitura de Palmas",
      },
    },
    update: {
      status: "IN_REVIEW",
      protocol: "PMP-2026-0001",
    },
    create: {
      tenantId: tenant.id,
      serviceId: service.id,
      authority: "Prefeitura de Palmas",
      protocol: "PMP-2026-0001",
      status: "IN_REVIEW",
    },
  });

  await prisma.workLog.upsert({
    where: {
      tenantId_serviceId_performedAt_summary: {
        tenantId: tenant.id,
        serviceId: service.id,
        performedAt: new Date("2026-05-06T12:00:00.000Z"),
        summary: "Levantamento inicial em campo",
      },
    },
    update: {
      taskId: architectureTask.id,
      hours: new Prisma.Decimal("3.50"),
    },
    create: {
      tenantId: tenant.id,
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
      tenantId_serviceId_title: {
        tenantId: tenant.id,
        serviceId: service.id,
        title: "Proposta aprovada",
      },
    },
    update: {
      visibility: DocumentVisibility.CLIENT_VISIBLE,
      url: "https://example.com/obraflow/proposta-aprovada.pdf",
      mimeType: "application/pdf",
    },
    create: {
      tenantId: tenant.id,
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
