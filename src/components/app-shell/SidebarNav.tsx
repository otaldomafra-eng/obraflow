"use client";

import {
  ClipboardList,
  FileText,
  FolderOpen,
  HardHat,
  Home,
  Layers,
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
}

const navEntries: NavEntry[] = [
  { label: "Painel", href: "/dashboard", icon: Home },
  { label: "Clientes", href: "/clients", icon: Users },
  { label: "Imóveis", href: "/properties", icon: Home },
  { label: "Serviços", href: "/services", icon: ClipboardList },
  { label: "Comercial", href: "/commercial", icon: Layers },
  { label: "Propostas", href: "/proposals", icon: FileText },
  { label: "Projetos", href: "/projects", icon: FolderOpen },
  { label: "Aprovações", href: "/approvals", icon: FileText },
  { label: "Obras", href: "/works", icon: HardHat },
  { label: "Documentos", href: "/documents", icon: FolderOpen },
  { label: "Portal", href: "/portal-admin", icon: MessageSquareShare },
  { label: "IA", href: "/ai", icon: Layers },
  { label: "Configurações", href: "/settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navEntries.map((entry) => {
        const isActive = pathname === entry.href || pathname.startsWith(entry.href + "/");

        return (
          <Link
            key={entry.href}
            href={entry.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
            }`}
          >
            <entry.icon className="h-4 w-4 shrink-0" />
            <span>{entry.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
