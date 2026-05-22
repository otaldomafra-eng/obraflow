"use client";

import { useActionState, useState } from "react";

interface UserRow {
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    passwordHash: string | null;
    createdAt: Date;
  };
}

interface Props {
  users: UserRow[];
  currentUserId: string;
  createAction: (formData: FormData) => Promise<{ success?: string; error?: string }>;
  updateRoleAction: (formData: FormData) => Promise<{ success?: string; error?: string }>;
  removeAction: (formData: FormData) => Promise<{ success?: string; error?: string }>;
  isAdmin: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  INTERNAL_TEAM: "Equipe Interna",
  COMMERCIAL: "Comercial",
  TECHNICIAN: "Técnico",
  FIELD: "Campo",
  SUPPLIER: "Fornecedor",
  CLIENT: "Cliente",
};

export function UsersManager({
  users,
  currentUserId,
  createAction,
  updateRoleAction,
  removeAction,
  isAdmin,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("INTERNAL_TEAM");

  const [createState, createFormAction, createPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createAction(formData);
      return result ?? null;
    },
    null as { success?: string; error?: string } | null,
  );
  const [roleState, setRoleState] = useState<{ success?: string; error?: string } | null>(null);
  const [removeState, setRemoveState] = useState<{ success?: string; error?: string } | null>(null);

  async function handleRoleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRoleState(null);
    try {
      const result = await updateRoleAction(new FormData(e.currentTarget));
      if (result) setRoleState(result);
    } catch {
      setRoleState({ error: "Erro ao alterar cargo" });
    }
  }

  async function handleRemoveSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm("Remover este usuário do escritório?")) return;
    setRemoveState(null);
    try {
      const result = await removeAction(new FormData(e.currentTarget));
      if (result) setRemoveState(result);
    } catch {
      setRemoveState({ error: "Erro ao remover usuário" });
    }
  }

  const message = createState ?? roleState ?? removeState;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Usuários</h1>
          <p className="mt-1 text-sm text-zinc-500">Gerencie os usuários do seu escritório.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowCreate(!showCreate); }}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            {showCreate ? "Cancelar" : "Novo Usuário"}
          </button>
        )}
      </div>

      {message?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message.error}</div>
      )}
      {message?.success && !showCreate && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message.success}</div>
      )}

      {isAdmin && showCreate && !createState?.success && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold">Novo Usuário</h2>
          <form action={createFormAction} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zinc-700">Nome *</label>
              <input id="name" name="name" required
                className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700">Email *</label>
              <input id="email" name="email" type="email" required
                className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
            <div>
              <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-zinc-700">Cargo *</label>
              <select id="role" name="role" defaultValue="INTERNAL_TEAM"
                className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-700">Senha temporária *</label>
              <input id="password" name="password" type="password" required minLength={8}
                className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
              <p className="mt-1 text-xs text-zinc-400">Mínimo de 8 caracteres</p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-zinc-700">Confirmar senha *</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8}
                className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
            {createState?.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{createState.error}</div>
            )}
            <button type="submit" disabled={createPending}
              className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
              {createPending ? "Criando..." : "Criar Usuário"}
            </button>
          </form>
        </div>
      )}

      {isAdmin && showCreate && createState?.success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <p className="text-sm text-green-700">{createState.success}</p>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="divide-y divide-zinc-100">
          {users.map((row) => (
            <div key={row.user.id} className="flex items-center justify-between px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {row.user.name ?? "Sem nome"}
                </p>
                <p className="text-sm text-zinc-500 truncate">{row.user.email ?? "Sem email"}</p>
                <p className="text-xs text-zinc-400">
                  {new Date(row.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                {isAdmin && editingRole === row.user.id ? (
                  <form onSubmit={handleRoleSubmit} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={row.user.id} />
                    <select name="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-sm">
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button type="submit"
                      className="text-xs text-green-600 hover:text-green-700 font-medium">Salvar</button>
                    <button type="button" onClick={() => setEditingRole(null)}
                      className="text-xs text-zinc-400 hover:text-zinc-600">Cancelar</button>
                  </form>
                ) : (
                  <>
                    <span className="text-xs font-medium text-zinc-600 bg-zinc-100 rounded-full px-2.5 py-1">
                      {ROLE_LABELS[row.role] ?? row.role}
                    </span>
                    {isAdmin && row.user.id !== currentUserId && (
                      <button onClick={() => { setEditingRole(row.user.id); setSelectedRole(row.role); }}
                        className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                        Alterar
                      </button>
                    )}
                  </>
                )}
                {isAdmin && row.user.id !== currentUserId && editingRole !== row.user.id && (
                  <form onSubmit={handleRemoveSubmit}>
                    <input type="hidden" name="userId" value={row.user.id} />
                    <button type="submit"
                      className="text-xs text-red-400 hover:text-red-600 transition-colors">
                      Remover
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
        {users.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-zinc-400">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
