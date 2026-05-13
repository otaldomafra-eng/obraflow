export const serviceStatuses = [
  "NEW",
  "PROPOSAL",
  "AWAITING_ACCEPTANCE",
  "CONTRACTED",
  "PLANNING",
  "PRODUCTION",
  "APPROVAL",
  "WORK",
  "AWAITING_CLIENT",
  "PAUSED",
  "DELIVERED",
  "CANCELED",
] as const;

export const moduleKeys = [
  "COMMERCIAL",
  "PROPOSALS_CONTRACTS",
  "TECHNICAL_PRODUCTION",
  "APPROVALS",
  "WORKS",
  "DOCUMENTS",
  "CLIENT_PORTAL",
  "SUPPLIERS",
  "AI_ASSISTANT",
] as const;

export const userRoles = [
  "ADMIN",
  "MANAGER",
  "INTERNAL_TEAM",
  "COMMERCIAL",
  "TECHNICIAN",
  "FIELD",
  "SUPPLIER",
  "CLIENT",
] as const;

export const serviceTypes = [
  "TECHNICAL_PROJECT",
  "REGULARIZATION",
  "WORK_EXECUTION",
  "CONSULTING",
  "FIRE_SAFETY",
  "PROJECT_APPROVAL_WORK",
] as const;
