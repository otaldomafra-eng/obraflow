import { z } from "zod";

import { prisma } from "@/server/db/client";
import { hashPassword, verifyPassword } from "@/server/auth/password";

const ROLES = ["ADMIN", "MANAGER", "INTERNAL_TEAM", "COMMERCIAL", "TECHNICIAN", "FIELD", "SUPPLIER", "CLIENT"] as const;

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Mínimo de 8 caracteres"),
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Confirmação não confere",
  path: ["confirmPassword"],
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.enum(ROLES),
  password: z.string().min(8, "Mínimo de 8 caracteres"),
  confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Confirmação não confere",
  path: ["confirmPassword"],
});

export const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(ROLES),
});

export const removeUserSchema = z.object({
  userId: z.string().min(1),
});

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type CreateUserInput = z.input<typeof createUserSchema>;
export type UpdateRoleInput = z.input<typeof updateRoleSchema>;

async function getSessionUserId(): Promise<string> {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/server/auth/config");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function changePassword(
  tenantId: string,
  input: ChangePasswordInput,
) {
  const data = changePasswordSchema.parse(input);
  const userId = await getSessionUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) throw new Error("User not found");

  if (user.passwordHash) {
    if (!data.currentPassword) {
      throw new Error("Senha atual é obrigatória");
    }
    const valid = await verifyPassword(data.currentPassword, user.passwordHash);
    if (!valid) throw new Error("Senha atual incorreta");

    const same = await verifyPassword(data.newPassword, user.passwordHash);
    if (same) throw new Error("Nova senha deve ser diferente da atual");
  }

  const hashed = await hashPassword(data.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashed },
  });
}

export async function listUsers(tenantId: string) {
  return prisma.membership.findMany({
    where: { tenantId },
    select: {
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(
  tenantId: string,
  currentUserId: string,
  input: CreateUserInput,
) {
  const data = createUserSchema.parse(input);

  const callerRole = await prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId, userId: currentUserId } },
    select: { role: true },
  });

  if (!callerRole || callerRole.role !== "ADMIN") {
    throw new Error("Apenas administradores podem criar usuários");
  }

  const normalizedEmail = data.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId: existingUser.id } },
    });
    if (existingMembership) {
      throw new Error("Este email já está cadastrado neste tenant");
    }

    const hashed = await hashPassword(data.password);
    await prisma.membership.create({
      data: {
        tenantId,
        userId: existingUser.id,
        role: data.role,
      },
    });

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash: hashed },
    });

    return existingUser;
  }

  const hashed = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: normalizedEmail,
      passwordHash: hashed,
    },
  });

  await prisma.membership.create({
    data: {
      tenantId,
      userId: user.id,
      role: data.role,
    },
  });

  return user;
}

export async function updateUserRole(
  tenantId: string,
  currentUserId: string,
  input: UpdateRoleInput,
) {
  const data = updateRoleSchema.parse(input);

  const callerRole = await prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId, userId: currentUserId } },
    select: { role: true },
  });

  if (!callerRole || callerRole.role !== "ADMIN") {
    throw new Error("Apenas administradores podem alterar cargos");
  }

  const targetMembership = await prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId, userId: data.userId } },
  });

  if (!targetMembership) {
    throw new Error("Usuário não encontrado neste tenant");
  }

  if (targetMembership.role === "ADMIN" && data.role !== "ADMIN") {
    const adminCount = await prisma.membership.count({
      where: { tenantId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      throw new Error("Não é possível remover o último administrador");
    }
  }

  return prisma.membership.update({
    where: { tenantId_userId: { tenantId, userId: data.userId } },
    data: { role: data.role },
  });
}

export async function removeUser(
  tenantId: string,
  currentUserId: string,
  userId: string,
) {
  removeUserSchema.parse({ userId });

  const callerRole = await prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId, userId: currentUserId } },
    select: { role: true },
  });

  if (!callerRole || callerRole.role !== "ADMIN") {
    throw new Error("Apenas administradores podem remover usuários");
  }

  const targetMembership = await prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  });

  if (!targetMembership) {
    throw new Error("Usuário não encontrado neste tenant");
  }

  if (targetMembership.role === "ADMIN") {
    const adminCount = await prisma.membership.count({
      where: { tenantId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      throw new Error("Não é possível remover o último administrador");
    }
  }

  await prisma.membership.delete({
    where: { tenantId_userId: { tenantId, userId } },
  });
}
