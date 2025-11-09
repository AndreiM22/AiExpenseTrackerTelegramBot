import type { ExpenseResponse } from "@/lib/types";
import { formatCurrency, formatFullDate } from "@/lib/utils";
import { ReceiptText } from "lucide-react";

type Props = {
  expenses: ExpenseResponse[];
};

const sourceLabels: Record<string, { label: string; color: string }> = {
  photo: { label: "Foto", color: "bg-emerald-400/20 text-emerald-200" },
  voice: { label: "Voce", color: "bg-blue-400/20 text-blue-200" },
  manual: { label: "Manual", color: "bg-purple-400/20 text-purple-200" },
};

export function RecentExpensesTable({ expenses }: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Activitate recentă
          </p>
          <p className="text-sm text-white/70">Ultimele 5 tranzacții</p>
        </div>
        <button className="text-sm font-medium text-emerald-300 hover:text-emerald-200">
          Vezi toate
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white/80">
          <thead>
            <tr className="text-xs uppercase tracking-[0.25em] text-white/40">
              <th className="pb-3 font-medium">Vendor</th>
              <th className="pb-3 font-medium">Dată</th>
              <th className="pb-3 font-medium">Sursă</th>
              <th className="pb-3 font-medium text-right">Sumă</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {expenses.map((expense) => {
              const source = sourceLabels[expense.source] || {
                label: expense.source,
                color: "bg-white/10 text-white",
              };

              return (
                <tr key={expense.id} className="align-middle">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
                        <ReceiptText className="h-4 w-4 text-emerald-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {expense.vendor || "Vendor criptat"}
                        </p>
                        <p className="text-xs text-white/50">
                          ID: {expense.id.slice(0, 6)}…
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-white/70">
                    {formatFullDate(expense.purchase_date || expense.created_at)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${source.color}`}
                    >
                      {source.label}
                    </span>
                  </td>
                  <td className="py-3 text-right font-semibold text-white">
                    {formatCurrency(expense.amount, expense.currency || "MDL")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
