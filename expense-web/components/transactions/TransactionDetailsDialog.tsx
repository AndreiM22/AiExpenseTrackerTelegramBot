"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ExpenseDetailResponse,
  ExpenseResponse,
} from "@/lib/types";
import { formatCurrency, formatFullDate } from "@/lib/utils";
import { PUBLIC_API_BASE } from "@/lib/api";
import { Loader2, X } from "lucide-react";

type Props = {
  expense: ExpenseResponse | null;
  onClose: () => void;
};

type ParsedItem = {
  name?: string;
  qty?: number | string;
  price?: number | string;
  total?: number | string;
};

const sourceNames: Record<string, string> = {
  manual: "Manual",
  photo: "Foto",
  voice: "Voce",
};

export function TransactionDetailsDialog({
  expense,
  onClose,
}: Props) {
  const [details, setDetails] =
    useState<ExpenseDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const expenseId = expense?.id ?? null;

  const closeDialog = () => {
    abortRef.current?.abort();
    setDetails(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  const fetchDetails = useCallback(async () => {
    if (!expenseId) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setDetails(null);

    try {
      const response = await fetch(
        `${PUBLIC_API_BASE}/api/v1/expenses/${expenseId}`,
        {
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        }
      );
      const payload = (await response.json()) as ExpenseDetailResponse & {
        detail?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload?.detail ||
            "Nu am putut încărca detaliile tranzacției."
        );
      }

      if (!controller.signal.aborted) {
        setDetails(payload);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "A apărut o eroare neașteptată."
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [expenseId]);

  useEffect(() => {
    if (expenseId) {
      fetchDetails();
    } else {
      setDetails(null);
      setError(null);
    }
  }, [expenseId, fetchDetails]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const items: ParsedItem[] = useMemo(() => {
    const raw = details?.json_data?.items;
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw
      .map((item) => {
        if (!item || typeof item !== "object") {
          return {};
        }
        const record = item as Record<string, unknown>;
        return {
          name:
            typeof record.name === "string"
              ? record.name
              : undefined,
          qty:
            typeof record.qty === "number" ||
            typeof record.qty === "string"
              ? record.qty
              : undefined,
          price:
            typeof record.price === "number" ||
            typeof record.price === "string"
              ? record.price
              : undefined,
          total:
            typeof record.total === "number" ||
            typeof record.total === "string"
              ? record.total
              : undefined,
        };
      })
      .filter(
        (item) =>
          item.name ||
          item.price !== undefined ||
          item.total !== undefined
      );
  }, [details]);

  if (!expense) {
    return null;
  }

  const currency =
    details?.currency || expense.currency || "MDL";

  const notes =
    typeof details?.json_data?.notes === "string"
      ? details?.json_data?.notes
      : null;

  const metadataEntries = [
    {
      label: "Cod fiscal",
      value:
        details?.vendor_fiscal_code ||
        expense.vendor_fiscal_code ||
        "—",
    },
    {
      label: "Nr. înregistrare",
      value:
        details?.vendor_registration_number ||
        expense.vendor_registration_number ||
        "—",
    },
    {
      label: "Adresă",
      value:
        details?.vendor_address ||
        expense.vendor_address ||
        "—",
    },
  ];

  const summaryCards = [
    {
      label: "Sumă",
      value: formatCurrency(
        details?.amount ?? expense.amount,
        currency
      ),
    },
    {
      label: "Categorie",
      value:
        details?.category_name ||
        expense.category_name ||
        "Fără categorie",
    },
    {
      label: "Dată achiziție",
      value: formatFullDate(
        details?.purchase_date ||
          expense.purchase_date ||
          expense.created_at
      ),
    },
    {
      label: "Sursă",
      value:
        (details?.source && sourceNames[details.source]) ||
        sourceNames[expense.source] ||
        expense.source,
    },
  ];

  if (
    details?.ai_confidence !== undefined &&
    details.ai_confidence !== null
  ) {
    summaryCards.push({
      label: "Încredere AI",
      value: `${Math.round(
        (details.ai_confidence ?? 0) * 100
      )}%`,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 px-4 py-6 backdrop-blur">
      <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">
              Detalii tranzacție
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {details?.vendor ||
                expense.vendor ||
                "Fără denumire"}
            </h2>
            <p className="text-sm text-white/60">
              ID: {expense.id}
            </p>
          </div>
          <button
            onClick={closeDialog}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-white/40"
            aria-label="Închide detaliile"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading && (
          <div className="mt-10 flex justify-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/70">
              <Loader2 className="mr-3 inline h-4 w-4 animate-spin" />
              Se încarcă detaliile...
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="mt-10 rounded-2xl border border-rose-400/30 bg-rose-950/40 px-6 py-4 text-sm text-rose-200">
            <p>{error}</p>
            <button
              onClick={fetchDetails}
              className="mt-3 rounded-xl border border-white/10 px-3 py-1 text-xs text-white hover:border-white/40"
            >
              Reîncearcă
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {card.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Detalii comerciant
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                {metadataEntries.map((entry) => (
                  <div key={entry.label}>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                      {entry.label}
                    </p>
                    <p className="mt-1 text-sm text-white/80">
                      {entry.value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {notes && (
              <div className="rounded-2xl border border-white/10 bg-emerald-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
                  Note AI
                </p>
                <p className="mt-2 text-sm text-white/90">
                  {notes}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Articole detectate
                  </p>
                  <p className="text-sm text-white/70">
                    {items.length
                      ? `${items.length} produse identificate`
                      : "Nu există articole înregistrate pentru această tranzacție."}
                  </p>
                </div>
              </div>

              {items.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm text-white/80">
                    <thead>
                      <tr className="text-xs uppercase tracking-[0.2em] text-white/40">
                        <th className="pb-2 font-medium">Produs</th>
                        <th className="pb-2 font-medium">Cantitate</th>
                        <th className="pb-2 font-medium">Preț unitar</th>
                        <th className="pb-2 font-medium text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {items.map((item, index) => (
                        <tr key={`${item.name}-${index}`}>
                          <td className="py-3 font-medium text-white">
                            {item.name || `Produs ${index + 1}`}
                          </td>
                          <td className="py-3">
                            {item.qty ?? "—"}
                          </td>
                          <td className="py-3">
                            {formatMoney(item.price, currency)}
                          </td>
                          <td className="py-3 text-right font-semibold text-white">
                            {formatMoney(item.total, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatMoney(
  value?: number | string,
  currency: string = "MDL"
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }
  const numeric =
    typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  return formatCurrency(numeric ?? 0, currency);
}
