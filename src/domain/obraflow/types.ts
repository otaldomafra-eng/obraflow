import { moduleKeys, serviceStatuses, serviceTypes, userRoles } from "./constants";

export type ServiceStatus = (typeof serviceStatuses)[number];
export type ModuleKey = (typeof moduleKeys)[number];
export type UserRole = (typeof userRoles)[number];
export type ServiceType = (typeof serviceTypes)[number];
