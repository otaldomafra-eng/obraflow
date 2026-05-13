import type { UserRole } from "./types";

export type Capability =
  | "settings.manage"
  | "clients.manage"
  | "services.manage"
  | "commercial.manage"
  | "proposals.manage"
  | "projects.manage"
  | "approvals.manage"
  | "works.manage"
  | "documents.manage"
  | "portal.view"
  | "ai.use";

const permissionMatrix: Record<UserRole, Capability[]> = {
  ADMIN: [
    "settings.manage",
    "clients.manage",
    "services.manage",
    "commercial.manage",
    "proposals.manage",
    "projects.manage",
    "approvals.manage",
    "works.manage",
    "documents.manage",
    "portal.view",
    "ai.use",
  ],
  MANAGER: [
    "settings.manage",
    "clients.manage",
    "services.manage",
    "commercial.manage",
    "proposals.manage",
    "projects.manage",
    "approvals.manage",
    "works.manage",
    "documents.manage",
    "portal.view",
    "ai.use",
  ],
  INTERNAL_TEAM: [
    "clients.manage",
    "services.manage",
    "projects.manage",
    "approvals.manage",
    "documents.manage",
    "portal.view",
    "ai.use",
  ],
  COMMERCIAL: [
    "clients.manage",
    "services.manage",
    "commercial.manage",
    "proposals.manage",
    "documents.manage",
    "portal.view",
  ],
  TECHNICIAN: [
    "services.manage",
    "projects.manage",
    "documents.manage",
    "portal.view",
    "ai.use",
  ],
  FIELD: [
    "services.manage",
    "works.manage",
    "documents.manage",
    "portal.view",
  ],
  SUPPLIER: [
    "documents.manage",
    "portal.view",
  ],
  CLIENT: [
    "portal.view",
  ],
};

const allCapabilities = new Set<Capability>([
  "settings.manage",
  "clients.manage",
  "services.manage",
  "commercial.manage",
  "proposals.manage",
  "projects.manage",
  "approvals.manage",
  "works.manage",
  "documents.manage",
  "portal.view",
  "ai.use",
]);

export function hasCapability(role: UserRole, capability: Capability): boolean {
  if (!allCapabilities.has(capability)) {
    return false;
  }

  return permissionMatrix[role]?.includes(capability) ?? false;
}

export function assertCapability(role: UserRole, capability: Capability): void {
  if (!hasCapability(role, capability)) {
    throw new Error(
      `Role ${role} does not have the required capability: ${capability}`,
    );
  }
}
