import { SignOutButton } from "../auth/SignOutButton";
import { Bell, Filter, Search } from "lucide-react";

type HeaderBarProps = {
  userName: string;
};

export function HeaderBar({ userName }: HeaderBarProps) {
  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(now);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/60 px-6 py-4 text-white backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Overview
          </p>
          <h1 className="text-2xl font-semibold text-white">
            Dashboard financiar
          </h1>
          <p className="text-sm text-white/60">{formattedDate}</p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 lg:w-72">
            <Search className="h-4 w-4" />
            <input
              placeholder="Caută tranzacții, vendori, categorii..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/10">
            <Filter className="h-4 w-4" />
            Filtre
          </button>
          <button className="relative rounded-2xl border border-white/10 bg-white/5 p-2 text-white transition hover:border-emerald-300/40 hover:bg-emerald-400/10">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-400"></span>
          </button>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
            <div className="hidden flex-col text-left text-xs leading-tight text-white/70 sm:flex">
              <span className="text-[0.6rem] uppercase tracking-[0.35em] text-emerald-200/70">
                Logat ca
              </span>
              <span className="text-sm text-white">{userName}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
