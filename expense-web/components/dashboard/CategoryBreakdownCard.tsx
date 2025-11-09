import type { CategoryBreakdown } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Tag } from "lucide-react";
import { CategoryDonutChart } from "../charts/CategoryDonutChart";

type Props = {
  categories: CategoryBreakdown;
};

export function CategoryBreakdownCard({ categories }: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_30px_rgba(15,23,42,0.45)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Categorii dominante
          </p>
          <p className="text-sm text-white/70">
            {categories.period} • {formatCurrency(categories.grand_total)}
          </p>
        </div>
        <Tag className="h-5 w-5 text-white/70" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(240px,320px)_1fr]">
        <div className="flex items-center justify-center rounded-3xl bg-slate-900/40 p-6">
          <CategoryDonutChart breakdown={categories.categories} />
        </div>

        <div className="space-y-4">
          {categories.categories.length === 0 && (
            <p className="text-sm text-white/60">
              Nu există încă tranzacții clasificate pe categorii.
            </p>
          )}
          {categories.categories.slice(0, 6).map((category) => (
            <div
              key={category.category_id}
              className="rounded-2xl bg-white/5 p-4 transition hover:bg-white/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: category.color || "#5eead4" }}
                  />
                  <div>
                    <p className="font-medium text-white">
                      {category.category_name}
                    </p>
                    <p className="text-xs text-white/50">
                      {category.count} tranzacții
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">
                    {formatCurrency(category.total)}
                  </p>
                  <p className="text-xs text-white/60">
                    {category.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
