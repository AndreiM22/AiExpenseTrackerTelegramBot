"use client";

import { useMemo, useState } from "react";
import type { CategoryResponse } from "@/lib/types";
import {
  AddCategoryDialog,
  DeleteCategoryDialog,
  EditCategoryDialog,
} from "./CategoryDialogs";
import { formatCurrency } from "@/lib/utils";
import { CirclePlus, Pencil, Trash2 } from "lucide-react";

type CategoryWithStats = CategoryResponse & {
  total_expenses: number;
  total_amount: number;
};

type Props = {
  categories: CategoryWithStats[];
};

type StatusState = { type: "idle" | "success" | "error"; message?: string };

export function CategoriesTable({ categories }: Props) {
  const [rows, setRows] = useState(() =>
    [...categories].sort((a, b) => Number(b.is_default) - Number(a.is_default))
  );
  const [status, setStatus] = useState<StatusState>({ type: "idle" });
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(null);

  const totalTransactions = useMemo(
    () => rows.reduce((sum, row) => sum + row.total_expenses, 0),
    [rows]
  );

  const handleAdded = (category: CategoryResponse) => {
    const withStats: CategoryWithStats = {
      ...category,
      total_expenses: 0,
      total_amount: 0,
    };
    setRows((prev) => [withStats, ...prev]);
    setStatus({
      type: "success",
      message: "Categoria a fost adăugată.",
    });
  };

  const handleUpdated = (category: CategoryResponse) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== category.id) {
          return row;
        }
        return {
          ...row,
          ...category,
        };
      })
    );
    setStatus({
      type: "success",
      message: "Categoria a fost actualizată.",
    });
  };

  const handleDeleted = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
    setStatus({
      type: "success",
      message: "Categoria a fost ștearsă.",
    });
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_30px_rgba(15,23,42,0.35)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Categorii
          </p>
          <p className="text-sm text-white/70">
            {rows.length} categorii • {totalTransactions} tranzacții totale
          </p>
          {status.type !== "idle" && (
            <p
              className={`text-xs ${
                status.type === "success" ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {status.message}
            </p>
          )}
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90"
        >
          <CirclePlus className="h-4 w-4" />
          Adaugă categorie
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white/80">
          <thead>
            <tr className="text-xs uppercase tracking-[0.25em] text-white/40">
              <th className="pb-3 font-medium">Categorie</th>
              <th className="pb-3 font-medium">Tip</th>
              <th className="pb-3 font-medium text-right">Tranzacții</th>
              <th className="pb-3 font-medium text-right">Total</th>
              <th className="pb-3 font-medium text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((category) => (
              <tr key={category.id}>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-xl"
                      style={{ color: category.color || "#F8FAFC" }}
                    >
                      {category.icon || "🏷️"}
                    </span>
                    <div>
                      <p className="font-medium text-white">{category.name}</p>
                      <p className="text-xs text-white/50">{category.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      category.is_default
                        ? "bg-white/10 text-white/80"
                        : "bg-emerald-500/20 text-emerald-200"
                    }`}
                  >
                    {category.is_default ? "Implicită" : "Custom"}
                  </span>
                </td>
                <td className="py-4 text-right">
                  {category.total_expenses} trx
                </td>
                <td className="py-4 text-right">
                  {formatCurrency(category.total_amount || 0)}
                </td>
                <td className="py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditTarget(category)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-white/40"
                      title="Editează"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(category)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-rose-400/60 hover:text-rose-200 disabled:opacity-40"
                      title={
                        category.is_default
                          ? "Nu poți șterge o categorie implicită"
                          : "Șterge"
                      }
                      disabled={category.is_default}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddCategoryDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={handleAdded}
        onError={(message) => setStatus({ type: "error", message })}
      />

      <EditCategoryDialog
        open={Boolean(editTarget)}
        category={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={handleUpdated}
        onError={(message) => setStatus({ type: "error", message })}
      />

      <DeleteCategoryDialog
        open={Boolean(deleteTarget)}
        category={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
        onError={(message) => setStatus({ type: "error", message })}
      />
    </section>
  );
}
