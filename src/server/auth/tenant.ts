import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { assertCapability, type Capability } from "@/domain/obraflow/permissions";
import type { UserRole } from "@/domain/obraflow/types";
import { prisma } from "@/server/db/client";

import { authOptions } from "./config";

export async function getCurrentTenantId(): Promise<string | null> {
  const session = await getServerSession(authOptions);

  return session?.user?.tenantId ?? null;
}

export async function requireTenantId(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const tenantId = session.user.tenantId;

  if (!tenantId) {
    redirect("/sign-in");
  }

  return tenantId;
}

export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<{ tenantId: string; role: UserRole }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) throw new Error("Not authenticated");

  const tenantId = session.user.tenantId;

  if (!tenantId) throw new Error("No tenant context");

  const membership = await prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId, userId: session.user.id } },
  });

  if (!membership) throw new Error("User has no membership in this tenant");

  const role = membership.role as UserRole;

  if (!allowedRoles.includes(role)) {
    throw new Error(
      `Requires one of roles: ${allowedRoles.join(", ")}, but user has role: ${role}`,
    );
  }

  return { tenantId, role };
}

export async function requireCapability(
  capability: Capability,
): Promise<{ tenantId: string; role: UserRole }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) throw new Error("Not authenticated");

  const tenantId = session.user.tenantId;

  if (!tenantId) throw new Error("No tenant context");

  const membership = await prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId, userId: session.user.id } },
  });

  if (!membership) throw new Error("User has no membership in this tenant");

  const role = membership.role as UserRole;

  assertCapability(role, capability);

  return { tenantId, role };
}
