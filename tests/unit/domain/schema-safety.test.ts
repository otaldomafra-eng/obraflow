import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");

function modelBlock(modelName: string) {
  const match = schema.match(new RegExp(`model ${modelName} \\{[\\s\\S]*?\\n\\}`));
  if (!match) {
    throw new Error(`Missing Prisma model ${modelName}`);
  }

  return match[0];
}

describe("Prisma schema safety", () => {
  it("uses external keys instead of human labels for seed idempotency", () => {
    const models = [
      "Client",
      "Property",
      "Service",
      "Lead",
      "Opportunity",
      "Proposal",
      "Contract",
      "ProjectPhase",
      "ServiceTask",
      "ApprovalProcess",
      "WorkLog",
      "WorkMeasurement",
      "Document",
    ];

    for (const model of models) {
      const block = modelBlock(model);

      expect(block).toContain("externalKey");
      expect(block).toContain("@@unique([tenantId, externalKey])");
    }

    expect(modelBlock("Client")).not.toContain("@@unique([tenantId, email])");
    expect(modelBlock("Service")).not.toContain("@@unique([tenantId, clientId, title])");
    expect(modelBlock("ProjectPhase")).not.toContain("@@unique([tenantId, serviceId, name])");
    expect(modelBlock("ServiceTask")).not.toContain("@@unique([tenantId, serviceId, title])");
    expect(modelBlock("Document")).not.toContain("@@unique([tenantId, serviceId, title])");
  });

  it("scopes business foreign keys by tenant and parent identity", () => {
    expect(modelBlock("Property")).toMatch(
      /client\s+Client\s+@relation\(fields: \[tenantId, clientId\], references: \[tenantId, id\], onDelete: Restrict\)/,
    );
    expect(modelBlock("Service")).toMatch(
      /client\s+Client\s+@relation\(fields: \[tenantId, clientId\], references: \[tenantId, id\], onDelete: Restrict\)/,
    );
    expect(modelBlock("Service")).toMatch(
      /property\s+Property\?\s+@relation\(fields: \[tenantId, clientId, propertyId\], references: \[tenantId, clientId, id\], onDelete: Restrict\)/,
    );
    expect(modelBlock("ServiceTask")).toMatch(
      /phase\s+ProjectPhase\?\s+@relation\(fields: \[tenantId, serviceId, phaseId\], references: \[tenantId, serviceId, id\], onDelete: Restrict\)/,
    );
    expect(modelBlock("Contract")).toMatch(
      /proposal\s+Proposal\?\s+@relation\(fields: \[tenantId, serviceId, proposalId\], references: \[tenantId, serviceId, id\], onDelete: Restrict\)/,
    );
  });

  it("restricts operational business deletes instead of cascading history", () => {
    const operationalModels = [
      "Client",
      "Property",
      "Service",
      "Lead",
      "Opportunity",
      "Proposal",
      "Contract",
      "ProjectPhase",
      "ServiceTask",
      "ApprovalProcess",
      "WorkLog",
      "WorkMeasurement",
      "Document",
      "Message",
      "TimelineEvent",
      "AiInteraction",
    ];

    for (const model of operationalModels) {
      const relationLines = modelBlock(model)
        .split("\n")
        .filter((line) => line.includes("@relation") && !line.includes("Tenant"));

      expect(relationLines.join("\n")).not.toContain("onDelete: Cascade");
      expect(relationLines.join("\n")).not.toContain("onDelete: SetNull");
    }
  });
});
