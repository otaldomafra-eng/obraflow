"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import type { SetupResult } from "@/features/setup/actions";

const initialState: { ok?: boolean; error?: string } = {};

export function SetupForm({
  action,
}: {
  action: (data: FormData) => Promise<SetupResult>;
}) {
  const router = useRouter();

  async function handleSubmit(_prev: unknown, formData: FormData) {
    const result = await action(formData);

    if (result.ok) {
      router.push("/sign-in");
    }

    return result;
  }

  const [state, formAction, pending] = useActionState(handleSubmit, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Seu nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-400">Mínimo de 8 caracteres</p>
      </div>

      <hr className="border-zinc-200" />

      <div>
        <label htmlFor="tenantName" className="block text-sm font-medium text-zinc-700">
          Nome do escritório
        </label>
        <input
          id="tenantName"
          name="tenantName"
          type="text"
          required
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="tenantSlug" className="block text-sm font-medium text-zinc-700">
          Slug do escritório
        </label>
        <input
          id="tenantSlug"
          name="tenantSlug"
          type="text"
          required
          pattern="[a-z0-9-]+"
          placeholder="meu-escritorio"
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-400">
          Apenas letras minúsculas, números e hífens
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Criando..." : "Criar administrador"}
      </button>
    </form>
  );
}
