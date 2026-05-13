import { describe, expect, it } from "vitest";
import { hasCapability, assertCapability } from "@/domain/obraflow/permissions";

describe("permission matrix", () => {
  it("allows admin to manage settings", () => {
    expect(hasCapability("ADMIN", "settings.manage")).toBe(true);
  });

  it("denies commercial from managing settings", () => {
    expect(hasCapability("COMMERCIAL", "settings.manage")).toBe(false);
  });

  it("allows commercial to manage commercial pipeline and proposals", () => {
    expect(hasCapability("COMMERCIAL", "commercial.manage")).toBe(true);
    expect(hasCapability("COMMERCIAL", "proposals.manage")).toBe(true);
    expect(hasCapability("COMMERCIAL", "clients.manage")).toBe(true);
  });

  it("allows technician to manage technical production tasks", () => {
    expect(hasCapability("TECHNICIAN", "projects.manage")).toBe(true);
    expect(hasCapability("TECHNICIAN", "ai.use")).toBe(true);
  });

  it("denies technician from managing commercial or settings", () => {
    expect(hasCapability("TECHNICIAN", "commercial.manage")).toBe(false);
    expect(hasCapability("TECHNICIAN", "settings.manage")).toBe(false);
  });

  it("allows field to manage works", () => {
    expect(hasCapability("FIELD", "works.manage")).toBe(true);
  });

  it("denies field from managing settings or commercial", () => {
    expect(hasCapability("FIELD", "settings.manage")).toBe(false);
    expect(hasCapability("FIELD", "commercial.manage")).toBe(false);
  });

  it("allows client to view portal", () => {
    expect(hasCapability("CLIENT", "portal.view")).toBe(true);
  });

  it("denies client from managing internal modules", () => {
    expect(hasCapability("CLIENT", "settings.manage")).toBe(false);
    expect(hasCapability("CLIENT", "projects.manage")).toBe(false);
    expect(hasCapability("CLIENT", "works.manage")).toBe(false);
    expect(hasCapability("CLIENT", "commercial.manage")).toBe(false);
  });

  it("assertCapability throws for missing capability", () => {
    expect(() => assertCapability("CLIENT", "settings.manage")).toThrow();
  });

  it("assertCapability passes for granted capability", () => {
    expect(() => assertCapability("ADMIN", "settings.manage")).not.toThrow();
  });

  it("supplier has limited document access", () => {
    expect(hasCapability("SUPPLIER", "documents.manage")).toBe(true);
    expect(hasCapability("SUPPLIER", "portal.view")).toBe(true);
    expect(hasCapability("SUPPLIER", "settings.manage")).toBe(false);
  });

  it("internal team can manage clients, projects, approvals and documents", () => {
    expect(hasCapability("INTERNAL_TEAM", "clients.manage")).toBe(true);
    expect(hasCapability("INTERNAL_TEAM", "projects.manage")).toBe(true);
    expect(hasCapability("INTERNAL_TEAM", "approvals.manage")).toBe(true);
    expect(hasCapability("INTERNAL_TEAM", "documents.manage")).toBe(true);
    expect(hasCapability("INTERNAL_TEAM", "settings.manage")).toBe(false);
  });
});
