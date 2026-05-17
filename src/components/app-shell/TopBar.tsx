"use client";

import { Bell } from "lucide-react";

interface TopBarProps {
  tenantName?: string;
  roleLabel?: string;
}

export function TopBar({ tenantName, roleLabel }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200/70 bg-white px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-zinc-800">
          {tenantName ?? "ObraFlow"}
        </span>
        {roleLabel && (
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
            {roleLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
