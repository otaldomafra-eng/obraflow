import { redirect } from "next/navigation";

import { prisma } from "@/server/db/client";
import { setupFirstAdmin } from "@/features/setup/actions";
import { SetupForm } from "./SetupForm";

export default async function SetupPage() {
  const existingAdmin = await prisma.membership.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    redirect("/sign-in");
  }

  async function handleSetup(data: FormData) {
    "use server";

    return setupFirstAdmin({
      name: data.get("name") as string,
      email: data.get("email") as string,
      password: data.get("password") as string,
      tenantName: data.get("tenantName") as string,
      tenantSlug: data.get("tenantSlug") as string,
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 text-zinc-900 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Configurar ObraFlow
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Crie o primeiro administrador para começar a usar o sistema.
        </p>
        <SetupForm action={handleSetup} />
      </div>
    </div>
  );
}
