import { getServerSession } from "next-auth";

import { assertCapability, type Capability } from "@/domain/obraflow/permissions";
import type { UserRole } from "@/domain/obraflow/types";
import { prisma } from "@/server/db/client";

import { authOptions } from "./config";

export async function getCurrentTenantId(): Promise<string | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    select: { tenantId: true },
  });

  return membership?.tenantId ?? null;
}

export async function requireTenantId(): Promise<string> {
  const tenantId = await getCurrentTenantId();

  if (!tenantId) {
    throw new Error("No tenant context — user is not associated with any tenant");
  }

  return tenantId;
}

export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<{ tenantId: string; role: UserRole }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) throw new Error("Not authenticated");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership) throw new Error("User has no tenant membership");

  const role = membership.role as UserRole;

  if (!allowedRoles.includes(role)) {
    throw new Error(
      `Requires one of roles: ${allowedRoles.join(", ")}, but user has role: ${role}`,
    );
  }

  return { tenantId: membership.tenantId, role };
}

export async function requireCapability(
  capability: Capability,
): Promise<{ tenantId: string; role: UserRole }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) throw new Error("Not authenticated");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership) throw new Error("User has no tenant membership");

  const role = membership.role as UserRole;

  assertCapability(role, capability);

  return { tenantId: membership.tenantId, role };
}
