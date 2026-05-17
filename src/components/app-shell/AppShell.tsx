import type { ReactNode } from "react";

import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children: ReactNode;
  tenantName?: string;
  roleLabel?: string;
}

export function AppShell({ children, tenantName, roleLabel }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-56 flex-col border-r border-zinc-200/70 bg-white">
        <div className="flex h-14 items-center gap-2 border-b border-zinc-100 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900">
            <span className="text-[10px] font-bold text-white">OF</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-800">
            ObraFlow
          </span>
        </div>
        <SidebarNav />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar tenantName={tenantName} roleLabel={roleLabel} />
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
