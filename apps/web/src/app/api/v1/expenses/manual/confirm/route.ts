import { NextResponse } from "next/server";
import { approvePendingExpense } from "@/server/mock-db";
import { logServerError } from "@/server/logging";

export async function POST(request: Request) {
  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json().catch(() => ({}));
    const pendingId = String(payload.pending_id ?? "").trim();
    if (!pendingId) {
      return NextResponse.json({ detail: "Previzualizarea nu mai este disponibilă." }, { status: 400 });
    }
    const categoryValue = payload.category_id;
    const expense = await approvePendingExpense({
      pendingId,
      overrides:
        categoryValue !== undefined
          ? {
              category_id: categoryValue === null || categoryValue === "" ? null : String(categoryValue),
            }
          : undefined,
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    await logServerError("manual_confirm_failed", error, {
      endpoint: "manual/confirm",
      pending_id: String(payload.pending_id ?? ""),
    });
    const detail = error instanceof Error ? error.message : "Nu am putut salva cheltuiala.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
