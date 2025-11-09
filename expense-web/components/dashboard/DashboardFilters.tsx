"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  dateFrom?: string;
  dateTo?: string;
};

export function DashboardFilters({ dateFrom, dateTo }: Props) {
  const [from, setFrom] = useState(dateFrom ?? "");
  const [to, setTo] = useState(dateTo ?? "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const hasActiveFilter = useMemo(() => {
    return Boolean(dateFrom || dateTo);
  }, [dateFrom, dateTo]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (from) {
      params.set("date_from", from);
    } else {
      params.delete("date_from");
    }
    if (to) {
      params.set("date_to", to);
    } else {
      params.delete("date_to");
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const resetFilters = () => {
    setFrom("");
    setTo("");
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("date_from");
    params.delete("date_to");
    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white shadow-[0_0_30px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs uppercase tracking-[0.35em] text-white/50">
            De la
          </label>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-300/60 focus:outline-none"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs uppercase tracking-[0.35em] text-white/50">
            Până la
          </label>
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-300/60 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
            disabled={pending}
          >
            Aplică
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/40 disabled:opacity-60"
            disabled={!hasActiveFilter || pending}
          >
            Resetează
          </button>
        </div>
      </div>
      {hasActiveFilter && (
        <p className="mt-3 text-xs text-white/60">
          Se afișează date pentru perioada {dateFrom || "?"} → {dateTo || "?"}
        </p>
      )}
    </section>
  );
}
