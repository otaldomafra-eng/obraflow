import { revalidatePath } from "next/cache";
import { requireTenantId } from "@/server/auth/tenant";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/config";
import { UsersManager } from "@/features/users/UsersManager";
import { listUsers, createUser, updateUserRole, removeUser } from "@/features/users/actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const tenantId = await requireTenantId();
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? "";

  const memberships = await listUsers(tenantId);

  const currentMembership = memberships.find((m) => m.user.id === currentUserId);
  const isAdmin = currentMembership?.role === "ADMIN";

  async function handleCreateUser(formData: FormData) {
    "use server";

    try {
      await createUser(tenantId, currentUserId, {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        role: formData.get("role") as "ADMIN" | "MANAGER" | "INTERNAL_TEAM" | "COMMERCIAL" | "TECHNICIAN" | "FIELD" | "SUPPLIER" | "CLIENT",
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
      });
      revalidatePath("/settings/users");
      return { success: "Usuário criado com sucesso" };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Erro ao criar usuário" };
    }
  }

  async function handleUpdateRole(formData: FormData) {
    "use server";

    try {
      await updateUserRole(tenantId, currentUserId, {
        userId: formData.get("userId") as string,
        role: formData.get("role") as "ADMIN" | "MANAGER" | "INTERNAL_TEAM" | "COMMERCIAL" | "TECHNICIAN" | "FIELD" | "SUPPLIER" | "CLIENT",
      });
      revalidatePath("/settings/users");
      return { success: "Cargo alterado com sucesso" };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Erro ao alterar cargo" };
    }
  }

  async function handleRemoveUser(formData: FormData) {
    "use server";

    try {
      await removeUser(tenantId, currentUserId, formData.get("userId") as string);
      revalidatePath("/settings/users");
      return { success: "Usuário removido com sucesso" };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Erro ao remover usuário" };
    }
  }

  return (
    <UsersManager
      users={memberships.map((m) => ({
        ...m,
        createdAt: m.createdAt,
        user: {
          ...m.user,
          createdAt: m.user.createdAt,
        },
      }))}
      currentUserId={currentUserId}
      createAction={handleCreateUser}
      updateRoleAction={handleUpdateRole}
      removeAction={handleRemoveUser}
      isAdmin={isAdmin}
    />
  );
}
