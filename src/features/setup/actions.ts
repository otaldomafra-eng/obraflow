import { z } from "zod";

import { prisma } from "@/server/db/client";
import { hashPassword } from "@/server/auth/password";

export const setupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  tenantName: z.string().min(1, "Nome do escritório é obrigatório"),
  tenantSlug: z
    .string()
    .min(1, "Slug é obrigatório")
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
});

export type SetupInput = z.input<typeof setupSchema>;

export interface SetupResult {
  ok: boolean;
  error?: string;
}

export async function setupFirstAdmin(data: SetupInput): Promise<SetupResult> {
  const parsed = setupSchema.safeParse(data);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos";

    return { ok: false, error: firstError };
  }

  const existingAdmin = await prisma.membership.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    return { ok: false, error: "Já existe um administrador configurado" };
  }

  const { name, email, password, tenantName, tenantSlug } = parsed.data;

  const tenantExists = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (tenantExists) {
    return { ok: false, error: "Este slug de escritório já está em uso" };
  }

  const emailInUse = await prisma.user.findUnique({
    where: { email },
  });

  if (emailInUse) {
    return { ok: false, error: "Este email já está em uso" };
  }

  const passwordHash = await hashPassword(password);

  const tenant = await prisma.tenant.create({
    data: { name: tenantName, slug: tenantSlug },
  });

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await prisma.membership.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      role: "ADMIN",
    },
  });

  return { ok: true };
}
