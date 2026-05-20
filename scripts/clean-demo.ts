import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

const connectionString = (() => {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL is required");
  }
  return value;
})();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const prefix = process.argv.find((arg) => arg.startsWith("--prefix="))?.split("=")[1] ?? "Demo Beta";

async function main() {
  if (process.env.CONFIRM_CLEAN_DEMO !== "1") {
    console.error("Set CONFIRM_CLEAN_DEMO=1 to confirm deletion of demo data.");
    process.exit(1);
  }

  console.log(`Searching for records with prefix "${prefix}"...`);

  const [
    workMeasurements,
    workLogs,
    approvalProcesses,
    serviceTasks,
    projectPhases,
    contracts,
    proposals,
    services,
    properties,
    clients,
  ] = await Promise.all([
    prisma.workMeasurement.findMany({ where: { description: { startsWith: prefix } }, select: { id: true } }),
    prisma.workLog.findMany({ where: { summary: { startsWith: prefix } }, select: { id: true } }),
    prisma.approvalProcess.findMany({ where: { authority: { startsWith: prefix } }, select: { id: true } }),
    prisma.serviceTask.findMany({ where: { title: { startsWith: prefix } }, select: { id: true } }),
    prisma.projectPhase.findMany({ where: { name: { startsWith: prefix } }, select: { id: true } }),
    prisma.contract.findMany({ where: { number: { startsWith: prefix } }, select: { id: true } }),
    prisma.proposal.findMany({ where: { title: { startsWith: prefix } }, select: { id: true } }),
    prisma.service.findMany({ where: { title: { startsWith: prefix } }, select: { id: true } }),
    prisma.property.findMany({ where: { name: { startsWith: prefix } }, select: { id: true } }),
    prisma.client.findMany({ where: { name: { startsWith: prefix } }, select: { id: true } }),
  ]);

  const total =
    workMeasurements.length +
    workLogs.length +
    approvalProcesses.length +
    serviceTasks.length +
    projectPhases.length +
    contracts.length +
    proposals.length +
    services.length +
    properties.length +
    clients.length;

  if (total === 0) {
    console.log("No demo data found. Nothing to clean.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${total} records to delete.`);

  await prisma.workMeasurement.deleteMany({ where: { id: { in: workMeasurements.map((r) => r.id) } } });
  await prisma.workLog.deleteMany({ where: { id: { in: workLogs.map((r) => r.id) } } });
  await prisma.approvalProcess.deleteMany({ where: { id: { in: approvalProcesses.map((r) => r.id) } } });
  await prisma.serviceTask.deleteMany({ where: { id: { in: serviceTasks.map((r) => r.id) } } });
  await prisma.projectPhase.deleteMany({ where: { id: { in: projectPhases.map((r) => r.id) } } });
  await prisma.contract.deleteMany({ where: { id: { in: contracts.map((r) => r.id) } } });
  await prisma.proposal.deleteMany({ where: { id: { in: proposals.map((r) => r.id) } } });
  await prisma.service.deleteMany({ where: { id: { in: services.map((r) => r.id) } } });
  await prisma.property.deleteMany({ where: { id: { in: properties.map((r) => r.id) } } });
  await prisma.client.deleteMany({ where: { id: { in: clients.map((r) => r.id) } } });

  console.log(`Deleted ${total} demo records.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
