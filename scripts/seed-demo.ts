import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  ClientKind,
  Prisma,
  PrismaClient,
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

const PREFIX = "Demo Beta";

const DATES = {
  now: new Date(),
  past: (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000),
  future: (daysFromNow: number) => new Date(Date.now() + daysFromNow * 86400000),
};

async function getTenantId(): Promise<string> {
  const slug = process.env.DEFAULT_TENANT_SLUG || "demo-obraflow";
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    throw new Error(
      `Tenant with slug "${slug}" not found. Run "pnpm db:seed" first.`,
    );
  }
  return tenant.id;
}

async function cleanDemoData(tenantId: string) {
  // Proposals must be deleted before services (onDelete: Restrict)
  const demoServiceIds = (
    await prisma.service.findMany({
      where: { tenantId, title: { startsWith: PREFIX } },
      select: { id: true },
    })
  ).map((s) => s.id);

  if (demoServiceIds.length > 0) {
    await prisma.proposal.deleteMany({
      where: { tenantId, serviceId: { in: demoServiceIds } },
    });
  }

  await prisma.workLog.deleteMany({
    where: { tenantId, summary: { startsWith: PREFIX } },
  });
  await prisma.serviceTask.deleteMany({
    where: { tenantId, title: { startsWith: PREFIX } },
  });
  await prisma.service.deleteMany({
    where: { tenantId, title: { startsWith: PREFIX } },
  });
  await prisma.property.deleteMany({
    where: { tenantId, name: { startsWith: PREFIX } },
  });
  await prisma.client.deleteMany({
    where: { tenantId, name: { startsWith: PREFIX } },
  });
}

async function main() {
  if (process.env.CONFIRM_DEMO_SEED !== "1") {
    console.error(
      "Set CONFIRM_DEMO_SEED=1 to run the demo seed script.",
    );
    console.error(
      "This will DELETE all existing records with prefix '" + PREFIX + "' and recreate demo data.",
    );
    process.exit(1);
  }

  const tenantId = await getTenantId();
  console.log(`Using tenant: ${tenantId}`);
  console.log(`Prefix: "${PREFIX}"`);

  await cleanDemoData(tenantId);
  console.log("Existing demo data cleaned.");

  // 3 clients
  const client1 = await prisma.client.create({
    data: {
      tenantId,
      name: "Demo Beta Ana Souza - Pessoa Física",
      kind: ClientKind.PERSON,
      document: "123.456.789-00",
      email: "ana.souza@email.com",
      phone: "(11) 99999-0001",
      notes: "Cliente demo interessada em reforma residencial. Prefere contato por WhatsApp.",
      externalKey: `demo-beta-client-1-${DATES.now.getTime()}`,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      tenantId,
      name: "Demo Beta Construtora Nova Era Ltda",
      kind: ClientKind.COMPANY,
      document: "12.345.678/0001-90",
      email: "contato@novaera.eng.br",
      phone: "(11) 3000-1234",
      notes: "Empresa de médio porte especializada em incorporação residencial.",
      externalKey: `demo-beta-client-2-${DATES.now.getTime()}`,
    },
  });

  const client3 = await prisma.client.create({
    data: {
      tenantId,
      name: "Demo Beta Carlos Pereira",
      kind: ClientKind.PERSON,
      externalKey: `demo-beta-client-3-${DATES.now.getTime()}`,
    },
  });

  // 3 properties
  const prop1 = await prisma.property.create({
    data: {
      tenantId,
      clientId: client1.id,
      name: "Demo Beta Casa Jardim das Flores",
      address: "Rua das Orquídeas, 123",
      city: "São Paulo",
      state: "SP",
      postalCode: "01234-567",
      externalKey: `demo-beta-prop-1-${DATES.now.getTime()}`,
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      tenantId,
      clientId: client2.id,
      name: "Demo Beta Residencial Nova Era",
      address: "Av. Principal, 1000",
      city: "Barueri",
      state: "SP",
      postalCode: "06401-100",
      externalKey: `demo-beta-prop-2-${DATES.now.getTime()}`,
    },
  });

  await prisma.property.create({
    data: {
      tenantId,
      clientId: client2.id,
      name: "Demo Beta Condomínio Parque Verde",
      address: "Rua dos Ipês, 500",
      city: "São Paulo",
      state: "SP",
      externalKey: `demo-beta-prop-3-${DATES.now.getTime()}`,
    },
  });

  // 4 services with different statuses
  const svc1 = await prisma.service.create({
    data: {
      tenantId,
      clientId: client1.id,
      propertyId: prop1.id,
      title: "Demo Beta Reforma Residencial Completa",
      type: ServiceType.WORK_EXECUTION,
      status: ServiceStatus.NEW,
      description: "Reforma completa incluindo elétrica, hidráulica e acabamentos.",
      startDate: DATES.future(5),
      dueDate: DATES.future(60),
      externalKey: `demo-beta-svc-1-${DATES.now.getTime()}`,
    },
  });

  const svc2 = await prisma.service.create({
    data: {
      tenantId,
      clientId: client2.id,
      propertyId: prop2.id,
      title: "Demo Beta Aprovação de Projeto Residencial",
      type: ServiceType.PROJECT_APPROVAL_WORK,
      status: ServiceStatus.PRODUCTION,
      description: "Aprovação de projeto na prefeitura e órgãos competentes.",
      startDate: DATES.past(15),
      dueDate: DATES.future(30),
      externalKey: `demo-beta-svc-2-${DATES.now.getTime()}`,
    },
  });

  const svc3 = await prisma.service.create({
    data: {
      tenantId,
      clientId: client2.id,
      propertyId: prop2.id,
      title: "Demo Beta Projeto Estrutural",
      type: ServiceType.TECHNICAL_PROJECT,
      status: ServiceStatus.APPROVAL,
      description: "Projeto estrutural em análise nos órgãos competentes.",
      startDate: DATES.past(30),
      dueDate: DATES.past(2),
      externalKey: `demo-beta-svc-3-${DATES.now.getTime()}`,
    },
  });

  await prisma.service.create({
    data: {
      tenantId,
      clientId: client2.id,
      propertyId: prop2.id,
      title: "Demo Beta Consultoria de Regularização",
      type: ServiceType.REGULARIZATION,
      status: ServiceStatus.DELIVERED,
      description: "Consultoria para regularização de edificação existente. Serviço concluído.",
      startDate: DATES.past(90),
      dueDate: DATES.past(10),
      externalKey: `demo-beta-svc-4-${DATES.now.getTime()}`,
    },
  });

  // Tasks for svc2 (PRODUCTION) - pending and in production
  const t1 = await prisma.serviceTask.create({
    data: {
      tenantId,
      serviceId: svc1.id,
      title: "Demo Beta Vistoria técnica inicial",
      description: "Realizar vistoria no imóvel para levantamento de necessidades.",
      status: ServiceStatus.PLANNING,
      dueDate: DATES.future(7),
      externalKey: `demo-beta-task-1-${DATES.now.getTime()}`,
    },
  });

  const t2 = await prisma.serviceTask.create({
    data: {
      tenantId,
      serviceId: svc1.id,
      title: "Demo Beta Elaborar orçamento detalhado",
      description: "Orçamento completo com materiais, mão de obra e prazos.",
      status: ServiceStatus.PRODUCTION,
      dueDate: DATES.future(3),
      externalKey: `demo-beta-task-2-${DATES.now.getTime()}`,
    },
  });

  // Tasks for svc2 (APPROVAL) - with one overdue
  await prisma.serviceTask.create({
    data: {
      tenantId,
      serviceId: svc2.id,
      title: "Demo Beta Protocolo na prefeitura",
      description: "Protocolar documentação completa no departamento de aprovação.",
      status: ServiceStatus.PLANNING,
      dueDate: DATES.past(5),
      externalKey: `demo-beta-task-3-${DATES.now.getTime()}`,
    },
  });

  await prisma.serviceTask.create({
    data: {
      tenantId,
      serviceId: svc2.id,
      title: "Demo Beta Correções de projeto",
      description: "Ajustar projeto conforme solicitações da prefeitura.",
      status: ServiceStatus.PRODUCTION,
      dueDate: DATES.future(15),
      externalKey: `demo-beta-task-4-${DATES.now.getTime()}`,
    },
  });

  // Completed task on svc3
  const t5 = await prisma.serviceTask.create({
    data: {
      tenantId,
      serviceId: svc3.id,
      title: "Demo Beta Cálculo de cargas",
      description: "Dimensionamento de cargas estruturais.",
      status: ServiceStatus.DELIVERED,
      dueDate: DATES.past(3),
      completedAt: DATES.past(1),
      externalKey: `demo-beta-task-5-${DATES.now.getTime()}`,
    },
  });

  // Canceled task on svc3
  await prisma.serviceTask.create({
    data: {
      tenantId,
      serviceId: svc3.id,
      title: "Demo Beta Laudo geotécnico",
      description: "Contratar empresa terceirizada para laudo. Cancelado: orçamento recusado.",
      status: ServiceStatus.CANCELED,
      externalKey: `demo-beta-task-6-${DATES.now.getTime()}`,
    },
  });

  // Work logs
  await prisma.workLog.create({
    data: {
      tenantId,
      serviceId: svc1.id,
      taskId: t2.id,
      summary: "Demo Beta Levantamento de materiais",
      description: "Visita técnica ao imóvel para medição e lista de materiais necessários.",
      performedAt: DATES.past(2),
      hours: new Prisma.Decimal("4.50"),
    },
  });

  await prisma.workLog.create({
    data: {
      tenantId,
      serviceId: svc1.id,
      taskId: t2.id,
      summary: "Demo Beta Reunião com cliente",
      description: "Apresentação do escopo e definição de prioridades.",
      performedAt: DATES.past(1),
      hours: new Prisma.Decimal("2.00"),
    },
  });

  await prisma.workLog.create({
    data: {
      tenantId,
      serviceId: svc1.id,
      taskId: t1.id,
      summary: "Demo Beta Pesquisa de fornecedores",
      description: "Levantamento de cotações com 3 fornecedores de materiais.",
      performedAt: DATES.past(3),
      hours: new Prisma.Decimal("1.50"),
    },
  });

  await prisma.workLog.create({
    data: {
      tenantId,
      serviceId: svc3.id,
      taskId: t5.id,
      summary: "Demo Beta Elaboração de memorial de cálculo",
      description: "Documentação completa do memorial descritivo.",
      performedAt: DATES.past(2),
      hours: new Prisma.Decimal("6.00"),
    },
  });

  // ── Proposals ──────────────────────────────────────────
  console.log("  Seeding proposals...");

  const seedService1 = await prisma.service.findFirst({
    where: { tenantId, title: "Demo Beta Reforma Residencial Completa" },
    select: { id: true },
  });

  const seedService2 = await prisma.service.findFirst({
    where: { tenantId, title: "Demo Beta Aprovacao de Projeto Residencial" },
    select: { id: true },
  });

  const seedService3 = await prisma.service.findFirst({
    where: { tenantId, title: "Demo Beta Projeto Estrutural" },
    select: { id: true },
  });

  if (seedService1) {
    await prisma.proposal.create({
      data: {
        tenantId,
        serviceId: seedService1.id,
        title: "Proposta de Reforma Residencial Completa",
        status: "SENT",
        totalAmount: new Prisma.Decimal(45000.0),
        sentAt: DATES.past(10),
        validUntil: DATES.future(20),
        notes:
          "Escopo: reforma completa incluindo elétrica, hidráulica e acabamentos. Prazo estimado: 60 dias.",
      },
    });
  }

  if (seedService2) {
    await prisma.proposal.create({
      data: {
        tenantId,
        serviceId: seedService2.id,
        title: "Proposta de Aprovacao de Projeto Residencial",
        status: "ACCEPTED",
        totalAmount: new Prisma.Decimal(18500.0),
        sentAt: DATES.past(20),
        acceptedAt: DATES.past(15),
        validUntil: DATES.future(45),
        notes:
          "Aprovação de projeto residencial junto à Prefeitura de Palmas. Inclui todas as taxas.",
      },
    });
  }

  if (seedService3) {
    await prisma.proposal.create({
      data: {
        tenantId,
        serviceId: seedService3.id,
        title: "Proposta de Projeto Estrutural",
        status: "DRAFT",
        totalAmount: new Prisma.Decimal(12000.0),
        validUntil: DATES.future(60),
        notes: "Projeto estrutural em concreto armado. 3 pavimentos.",
      },
    });
  }

  console.log("Demo data created successfully!");
  console.log(`  Clients: 3 (${client1.name}, ${client2.name}, ${client3.name})`);
  console.log(`  Properties: 3`);
  console.log(`  Services: 4 (${svc1.title}, ${svc2.title}, ${svc3.title}, ...)`);
  console.log(`  Tasks: 6`);
  console.log(`  Work Logs: 4`);

  const client = await prisma.client.findFirst({
    where: { tenantId, name: { startsWith: PREFIX } },
    select: { id: true },
  });
  if (client) {
    console.log(`\nTest with: /clients/${client.id}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
