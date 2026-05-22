"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  action: (formData: FormData) => Promise<{ success?: string; error?: string } | void>;
  hasPassword: boolean;
}

export function SecurityForm({ action, hasPassword }: Props) {
  const router = useRouter();
  const [state, setState] = useState<{ success?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setState(null);
    try {
      const result = await action(new FormData(e.currentTarget));
      if (result) setState(result);
      if (result?.success) {
        setTimeout(() => router.refresh(), 2000);
      }
    } catch {
      setState({ error: "Erro ao alterar senha" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {hasPassword && (
        <div>
          <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-zinc-700">
            Senha atual
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>
      )}

      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-zinc-700">
          {hasPassword ? "Nova senha" : "Senha"}
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
        <p className="mt-1 text-xs text-zinc-400">Mínimo de 8 caracteres</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Confirmar {hasPassword ? "nova senha" : "senha"}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Salvando..." : hasPassword ? "Alterar senha" : "Definir senha"}
      </button>
    </form>
  );
}
