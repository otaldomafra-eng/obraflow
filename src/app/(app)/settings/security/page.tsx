import { prisma } from "@/server/db/client";
import { requireTenantId } from "@/server/auth/tenant";
import { changePassword } from "@/features/users/actions";
import { SecurityForm } from "@/features/users/SecurityForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/config";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const tenantId = await requireTenantId();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? "";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  const hasPassword = !!user?.passwordHash;

  async function handleChangePassword(formData: FormData) {
    "use server";

    try {
      await changePassword(tenantId, {
        currentPassword: (formData.get("currentPassword") as string) || undefined,
        newPassword: formData.get("newPassword") as string,
        confirmPassword: formData.get("confirmPassword") as string,
      });
      return { success: hasPassword ? "Senha alterada com sucesso" : "Senha definida com sucesso" };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Erro ao alterar senha" };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Segurança</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {hasPassword ? "Altere sua senha de acesso ao sistema." : "Defina uma senha para sua conta."}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <SecurityForm action={handleChangePassword} hasPassword={hasPassword} />
      </div>
    </div>
  );
}
