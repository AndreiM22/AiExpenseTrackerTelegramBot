import { NextResponse } from "next/server";
import { rejectPendingExpense } from "@/server/mock-db";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const pendingId = String(payload.pending_id ?? "").trim();
    if (!pendingId) {
      return NextResponse.json({ detail: "Lipsește identificatorul previzualizării." }, { status: 400 });
    }
    await rejectPendingExpense(pendingId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Nu am putut marca previzualizarea.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
