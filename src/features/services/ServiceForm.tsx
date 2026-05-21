"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ServiceFormProps {
  action: (formData: FormData) => Promise<{ redirectUrl?: string } | void>;
  clients: { id: string; name: string }[];
  propertiesByClient: Record<string, { id: string; name: string }[]>;
  initialClientId?: string;
  initialPropertyId?: string;
}

const serviceTypes = [
  { value: "TECHNICAL_PROJECT", label: "Projeto Técnico" },
  { value: "REGULARIZATION", label: "Regularização" },
  { value: "WORK_EXECUTION", label: "Execução de Obra" },
  { value: "CONSULTING", label: "Consultoria" },
  { value: "FIRE_SAFETY", label: "Prevenção de Incêndio" },
  { value: "PROJECT_APPROVAL_WORK", label: "Aprovação de Projeto" },
];

export function ServiceForm({
  action,
  clients,
  propertiesByClient,
  initialClientId,
  initialPropertyId,
}: ServiceFormProps) {
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState(initialClientId ?? "");
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null as { redirectUrl?: string } | null,
  );

  useEffect(() => {
    if (state?.redirectUrl) {
      router.push(state.redirectUrl);
    }
  }, [state, router]);

  const properties = selectedClientId
    ? propertiesByClient[selectedClientId] ?? []
    : [];

  return (
    <form action={formAction} className="space-y-5">
      {isPending && (
        <div className="rounded-lg bg-zinc-50 px-4 py-2 text-sm text-zinc-600">
          Salvando...
        </div>
      )}
      <Field label="Cliente *" id="clientId">
        <select
          id="clientId"
          name="clientId"
          required
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        >
          <option value="">Selecione um cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Imóvel" id="propertyId">
        <select
          id="propertyId"
          name="propertyId"
          defaultValue={initialPropertyId ?? ""}
          disabled={properties.length === 0}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
        >
          <option value="">Nenhum (opcional)</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Título *" id="title">
        <input
          id="title"
          name="title"
          required
          placeholder="Ex: Reforma Apartamento 101"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <Field label="Tipo de Serviço *" id="type">
        <select
          id="type"
          name="type"
          required
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        >
          <option value="">Selecione o tipo</option>
          {serviceTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Descrição" id="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Data de Início" id="startDate">
          <input
            id="startDate"
            name="startDate"
            type="date"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
        <Field label="Data de Entrega" id="dueDate">
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
      </div>

      <hr className="border-zinc-200" />
      <h3 className="text-base font-semibold text-zinc-900">Dados Técnicos</h3>

      <Field label="Código Interno" id="internalCode">
        <input
          id="internalCode"
          name="internalCode"
          placeholder="Ex: SRV-2026-001"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <Field label="ART/RRT" id="artNumber">
        <input
          id="artNumber"
          name="artNumber"
          placeholder="Ex: 123456789"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Responsável Técnico" id="technicalLead">
          <input
            id="technicalLead"
            name="technicalLead"
            placeholder="Nome do profissional"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>

        <Field label="CREA/CAU" id="councilRegNumber">
          <input
            id="councilRegNumber"
            name="councilRegNumber"
            placeholder="Ex: CREA-SP 12345"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Criar Serviço
      </button>
    </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      {children}
    </div>
  );
}
