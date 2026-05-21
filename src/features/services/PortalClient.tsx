"use client";

interface PortalClientProps {
  serviceId: string;
  portalEnabled: boolean;
  portalToken: string | null;
  onEnable: (serviceId: string) => Promise<string>;
  onDisable: (serviceId: string) => Promise<void>;
}

export function PortalClient({
  serviceId,
  portalEnabled,
  portalToken,
  onEnable,
  onDisable,
}: PortalClientProps) {
  if (portalEnabled && portalToken) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-zinc-500">
          Portal ativo. Compartilhe o link abaixo com o cliente.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            aria-label="Link do portal"
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/portal/${portalToken}`}
            className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
            onClick={(e) => e.currentTarget.select()}
          />
          <a
            href={`/portal/${portalToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Abrir
          </a>
        </div>
        <form
          action={async () => {
            await onDisable(serviceId);
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Desativar portal
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={async () => {
        await onEnable(serviceId);
      }}
    >
      <button
        type="submit"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Ativar portal
      </button>
    </form>
  );
}
