import { describe, expect, it } from "vitest";
import { canTransitionServiceStatus, getDefaultModulesForServiceType } from "@/domain/obraflow/workflow";

describe("service workflow", () => {
  it("allows a new service to move into proposal", () => {
    expect(canTransitionServiceStatus("NEW", "PROPOSAL")).toBe(true);
  });

  it("blocks a delivered service from moving back to production", () => {
    expect(canTransitionServiceStatus("DELIVERED", "PRODUCTION")).toBe(false);
  });

  it("activates approval modules for regularization service", () => {
    expect(getDefaultModulesForServiceType("REGULARIZATION")).toEqual([
      "COMMERCIAL",
      "PROPOSALS_CONTRACTS",
      "APPROVALS",
      "DOCUMENTS",
      "CLIENT_PORTAL",
      "AI_ASSISTANT",
    ]);
  });

  it("keeps regularization defaults isolated from caller mutations", () => {
    const modules = getDefaultModulesForServiceType("REGULARIZATION");

    modules.push("WORKS");

    expect(getDefaultModulesForServiceType("REGULARIZATION")).toEqual([
      "COMMERCIAL",
      "PROPOSALS_CONTRACTS",
      "APPROVALS",
      "DOCUMENTS",
      "CLIENT_PORTAL",
      "AI_ASSISTANT",
    ]);
  });
});
