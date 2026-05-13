"use client";

interface ServiceFormProps {
  action: (formData: FormData) => Promise<void>;
  clients: { id: string; name: string }[];
  properties?: { id: string; name: string; clientId: string }[];
}

const serviceTypes = [
  { value: "TECHNICAL_PROJECT", label: "Projeto Técnico" },
  { value: "REGULARIZATION", label: "Regularização" },
  { value: "WORK_EXECUTION", label: "Execução de Obra" },
  { value: "CONSULTING", label: "Consultoria" },
  { value: "FIRE_SAFETY", label: "Prevenção de Incêndio" },
  { value: "PROJECT_APPROVAL_WORK", label: "Aprovação de Projeto" },
];

export function ServiceForm({ action, clients, properties = [] }: ServiceFormProps) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="clientId" className="block text-sm font-medium text-zinc-700">
          Cliente *
        </label>
        <select
          id="clientId"
          name="clientId"
          required
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        >
          <option value="">Selecione um cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="propertyId" className="block text-sm font-medium text-zinc-700">
          Imóvel
        </label>
        <select
          id="propertyId"
          name="propertyId"
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        >
          <option value="">Nenhum (opcional)</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-zinc-700">
          Título *
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="Ex: Reforma Apartamento 101"
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-zinc-700">
          Tipo de Serviço *
        </label>
        <select
          id="type"
          name="type"
          required
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        >
          <option value="">Selecione o tipo</option>
          {serviceTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700">
            Data de Início
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-zinc-700">
            Data de Entrega
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Criar Serviço
      </button>
    </form>
  );
}