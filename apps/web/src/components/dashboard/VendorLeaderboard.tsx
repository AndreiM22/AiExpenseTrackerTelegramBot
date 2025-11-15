import type { VendorStats } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Crown } from "lucide-react";

type Props = {
  vendors: VendorStats;
};

export function VendorLeaderboard({ vendors }: Props) {
  const maxValue = vendors.top_vendors[0]?.total ?? 1;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between text-sm text-white/70">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">
            Top vendori
          </p>
          <p className="text-sm text-white/70">{vendors.period}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs">
          <Crown className="h-3.5 w-3.5 text-amber-300" />
          leaderboard
        </span>
      </div>
      <div className="space-y-4">
        {vendors.top_vendors.length === 0 && (
          <p className="text-sm text-white/50">
            Nu există încă date despre vendori.
          </p>
        )}
        {vendors.top_vendors.map((vendor) => (
          <div key={vendor.vendor} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <p className="font-medium text-white">{vendor.vendor}</p>
              <p className="text-white/60">{formatCurrency(vendor.total)}</p>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                style={{
                  width: `${Math.max(
                    6,
                    (vendor.total / maxValue) * 100
                  ).toFixed(2)}%`,
                }}
              />
            </div>
            <p className="text-xs text-white/50">
              {vendor.count} tranzacții • {vendor.percentage.toFixed(1)}% din
              total
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
