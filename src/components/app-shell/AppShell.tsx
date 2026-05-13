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
      <aside className="flex w-56 flex-col border-r bg-white">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-base font-bold tracking-tight">ObraFlow</span>
        </div>
        <SidebarNav />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar tenantName={tenantName} roleLabel={roleLabel} />
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">{children}</main>
      </div>
    </div>
  );
}
