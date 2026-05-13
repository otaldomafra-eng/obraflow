import type { ModuleKey, ServiceStatus, ServiceType } from "./types";

const allowedTransitions: Record<ServiceStatus, ServiceStatus[]> = {
  NEW: ["PROPOSAL", "CANCELED"],
  PROPOSAL: ["AWAITING_ACCEPTANCE", "CANCELED"],
  AWAITING_ACCEPTANCE: ["CONTRACTED", "CANCELED"],
  CONTRACTED: ["PLANNING", "CANCELED"],
  PLANNING: ["PRODUCTION", "APPROVAL", "WORK", "PAUSED"],
  PRODUCTION: ["APPROVAL", "WORK", "AWAITING_CLIENT", "DELIVERED", "PAUSED"],
  APPROVAL: ["PRODUCTION", "WORK", "AWAITING_CLIENT", "DELIVERED", "PAUSED"],
  WORK: ["AWAITING_CLIENT", "DELIVERED", "PAUSED"],
  AWAITING_CLIENT: ["PRODUCTION", "APPROVAL", "WORK", "DELIVERED", "PAUSED"],
  PAUSED: ["PLANNING", "PRODUCTION", "APPROVAL", "WORK", "CANCELED"],
  DELIVERED: [],
  CANCELED: [],
};

const modulesByServiceType: Record<ServiceType, ModuleKey[]> = {
  TECHNICAL_PROJECT: [
    "COMMERCIAL",
    "PROPOSALS_CONTRACTS",
    "TECHNICAL_PRODUCTION",
    "DOCUMENTS",
    "CLIENT_PORTAL",
    "AI_ASSISTANT",
  ],
  REGULARIZATION: [
    "COMMERCIAL",
    "PROPOSALS_CONTRACTS",
    "APPROVALS",
    "DOCUMENTS",
    "CLIENT_PORTAL",
    "AI_ASSISTANT",
  ],
  WORK_EXECUTION: [
    "COMMERCIAL",
    "PROPOSALS_CONTRACTS",
    "WORKS",
    "DOCUMENTS",
    "CLIENT_PORTAL",
    "SUPPLIERS",
    "AI_ASSISTANT",
  ],
  CONSULTING: ["COMMERCIAL", "PROPOSALS_CONTRACTS", "DOCUMENTS", "CLIENT_PORTAL", "AI_ASSISTANT"],
  FIRE_SAFETY: [
    "COMMERCIAL",
    "PROPOSALS_CONTRACTS",
    "TECHNICAL_PRODUCTION",
    "APPROVALS",
    "DOCUMENTS",
    "CLIENT_PORTAL",
    "AI_ASSISTANT",
  ],
  PROJECT_APPROVAL_WORK: [
    "COMMERCIAL",
    "PROPOSALS_CONTRACTS",
    "TECHNICAL_PRODUCTION",
    "APPROVALS",
    "WORKS",
    "DOCUMENTS",
    "CLIENT_PORTAL",
    "SUPPLIERS",
    "AI_ASSISTANT",
  ],
};

export function canTransitionServiceStatus(from: ServiceStatus, to: ServiceStatus) {
  return allowedTransitions[from].includes(to);
}

export function getDefaultModulesForServiceType(serviceType: ServiceType) {
  return [...modulesByServiceType[serviceType]];
}
