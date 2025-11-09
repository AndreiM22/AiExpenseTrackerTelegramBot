"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  FolderKanban,
  LineChart,
  ReceiptText,
  Settings2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", icon: LineChart, href: "/" },
  { label: "Tranzacții", icon: ReceiptText, href: "/transactions" },
  { label: "Categorii", icon: FolderKanban, href: "/categories" },
  { label: "Statistici", icon: BarChart3, href: "/statistics" },
  { label: "Setări", icon: Settings2, href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 flex-none border-r border-white/10 bg-slate-950/70 px-6 py-8 text-sm text-white/70 backdrop-blur-xl lg:block">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-900">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-semibold text-white">Expense Bot AI</p>
          <p className="text-xs text-white/50">Control Center</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-white/10 hover:text-white",
                isActive && "bg-white/15 text-white shadow-[0_0_1rem_rgba(15,118,110,.35)]"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          Balanță lunară
        </p>
        <p className="mt-2 text-3xl font-semibold text-white">12 540 MDL</p>
        <p className="mt-2 text-xs text-white/60">
          +18% vs luna trecută. Continuă să urmărești progresul!
        </p>
        <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90">
          Adaugă cheltuială
        </button>
      </div>
    </aside>
  );
}
