"use client";

import {
  ClipboardList,
  FileText,
  FolderOpen,
  HardHat,
  Home,
  Layers,
  LayoutDashboard,
  MessageSquareShare,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavEntry {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const navEntries: NavEntry[] = [
  { label: "Painel", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/clients", icon: Users },
  { label: "Imóveis", href: "/properties", icon: Home },
  { label: "Serviços", href: "/services", icon: ClipboardList },
  { label: "Comercial", href: "/commercial", icon: Layers },
  { label: "Propostas", href: "/proposals", icon: FileText },
  { label: "Projetos", href: "/projects", icon: FolderOpen },
  { label: "Obras", href: "/works", icon: HardHat },
  { label: "Portal", href: "/portal-admin", icon: MessageSquareShare },
  { label: "Configurações", href: "/settings", icon: Settings },
];

const navGroups = [
  {
    label: "Principal",
    items: navEntries.slice(0, 4),
  },
  {
    label: "Comercial",
    items: navEntries.slice(4, 6),
  },
  {
    label: "Operacional",
    items: navEntries.slice(6, 9),
  },
  {
    label: "Sistema",
    items: navEntries.slice(9),
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6 overflow-y-auto px-3 py-5">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((entry) => {
              const isActive =
                pathname === entry.href ||
                pathname.startsWith(entry.href + "/");

              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
                  }`}
                >
                  <entry.icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? "text-zinc-900" : "text-zinc-400"
                    }`}
                  />
                  <span>{entry.label}</span>
                  {entry.badge && (
                    <span className="ml-auto rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                      {entry.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
