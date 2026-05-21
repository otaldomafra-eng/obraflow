"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ServiceOption {
  id: string;
  title: string;
  client: { name: string };
}

interface ProposalOption {
  id: string;
  title: string;
}

interface DocumentFormProps {
  action: (formData: FormData) => Promise<{ redirectUrl?: string; error?: string } | void>;
  services: ServiceOption[];
  proposals?: ProposalOption[];
  document?: {
    serviceId: string;
    proposalId?: string | null;
    title: string;
    url: string;
    visibility: string;
    mimeType: string | null;
    storagePath?: string | null;
    fileName?: string | null;
  };
}

export function DocumentForm({ action, services, proposals, document: doc }: DocumentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("serviceId");
  const preselectedProposalId = searchParams.get("proposalId");

  const [mode, setMode] = useState<"upload" | "url">(doc?.storagePath ? "upload" : "url");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await action(formData);
      return result ?? null;
    },
    null as { redirectUrl?: string; error?: string } | null,
  );

  useEffect(() => {
    if (state?.redirectUrl) router.push(state.redirectUrl);
  }, [state, router]);

  const hasFixedService = doc || preselectedServiceId;
  const fixedService = hasFixedService
    ? services.find((s) => s.id === (doc?.serviceId ?? preselectedServiceId))
    : null;

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${mode === "url" ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
        >
          URL externa
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${mode === "upload" ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
        >
          Upload de arquivo
        </button>
      </div>

      <input type="hidden" name="mode" value={mode} />

      <Field label="Serviço" id="serviceId">
        {hasFixedService ? (
          <>
            <input
              type="hidden"
              name="serviceId"
              value={doc?.serviceId ?? preselectedServiceId ?? ""}
            />
            <input
              id="serviceId"
              readOnly
              value={fixedService ? `${fixedService.title} — ${fixedService.client.name}` : "Carregando..."}
              className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
            />
          </>
        ) : (
          <select
            id="serviceId"
            name="serviceId"
            required
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">Selecione um serviço</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.title} — {s.client.name}</option>
            ))}
          </select>
        )}
      </Field>

      {(proposals && proposals.length > 0) || doc?.proposalId || preselectedProposalId ? (
        <Field label="Proposta (opcional)" id="proposalId">
          <input
            type="hidden"
            name="proposalId"
            value={doc?.proposalId ?? preselectedProposalId ?? ""}
          />
          <input
            id="proposalId"
            readOnly
            value={
              proposals && (doc?.proposalId ?? preselectedProposalId)
                ? proposals.find((p) => p.id === (doc?.proposalId ?? preselectedProposalId))?.title ?? ""
                : ""
            }
            className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
          />
        </Field>
      ) : null}

      <Field label="Título *" id="title">
        <input
          id="title"
          name="title"
          required
          defaultValue={doc?.title ?? ""}
          placeholder="Ex: Memorial Descritivo"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </Field>

      {mode === "url" ? (
        <Field label="URL do Arquivo *" id="url">
          <input
            id="url"
            name="url"
            type="url"
            required={mode === "url"}
            defaultValue={doc?.url ?? ""}
            placeholder="https://storage.example.com/documento.pdf"
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </Field>
      ) : (
        <Field label="Arquivo *" id="file">
          <input
            id="file"
            name="file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.dwg"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-zinc-900 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
          />
          {selectedFile && (
            <p className="mt-1 text-xs text-zinc-500">
              Selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-400">PDF, PNG, JPG, DOCX, XLSX, DWG — máx. 10MB</p>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Visibilidade" id="visibility">
          <select
            id="visibility"
            name="visibility"
            defaultValue={doc?.visibility ?? "INTERNAL"}
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="INTERNAL">Interno</option>
            <option value="CLIENT_VISIBLE">Visível ao Cliente</option>
            <option value="SUPPLIER_VISIBLE">Visível ao Fornecedor</option>
          </select>
        </Field>
        {mode === "url" && (
          <Field label="Tipo (opcional)" id="mimeType">
            <input
              id="mimeType"
              name="mimeType"
              defaultValue={doc?.mimeType ?? ""}
              placeholder="Ex: application/pdf"
              className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </Field>
        )}
      </div>

      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Salvando..." : doc ? "Salvar Documento" : "Adicionar Documento"}
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
