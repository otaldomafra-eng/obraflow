"use client";

import { Bell } from "lucide-react";

interface TopBarProps {
  tenantName?: string;
  roleLabel?: string;
}

export function TopBar({ tenantName, roleLabel }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-zinc-800">
          {tenantName ?? "ObraFlow"}
        </span>
        {roleLabel && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
            {roleLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
