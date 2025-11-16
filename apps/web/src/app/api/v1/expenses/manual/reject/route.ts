import { NextResponse } from "next/server";
import { rejectPendingExpense } from "@/server/mock-db";
import { logServerError } from "@/server/logging";

export async function POST(request: Request) {
  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json().catch(() => ({}));
    const pendingId = String(payload.pending_id ?? "").trim();
    if (!pendingId) {
      return NextResponse.json({ detail: "Lipsește identificatorul previzualizării." }, { status: 400 });
    }
    await rejectPendingExpense(pendingId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    await logServerError("manual_reject_failed", error, {
      endpoint: "manual/reject",
      pending_id: String(payload.pending_id ?? ""),
    });
    const detail = error instanceof Error ? error.message : "Nu am putut marca previzualizarea.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
