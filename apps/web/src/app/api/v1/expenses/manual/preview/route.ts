import { NextResponse } from "next/server";
import { generateManualPreview } from "@/server/ai/manual-expense";
import { createPendingExpense, listCategories } from "@/server/mock-db";
import { logServerError } from "@/server/logging";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const text = String(payload.text ?? "").trim();
    if (text.length < 5) {
      return NextResponse.json(
        { detail: "Descrie cheltuiala în câteva cuvinte." },
        { status: 400 }
      );
    }
    const categories = await listCategories();
    const preview = await generateManualPreview(text, { categories });
    if (!preview?.data) {
      throw new Error("Nu am putut interpreta textul.");
    }
    const pending = await createPendingExpense({
      raw_text: text,
      source: typeof payload.source === "string" ? payload.source : "manual",
      parsed_data: preview.data,
      metadata: {
        ai_source: preview.source,
        raw_response: preview.raw ?? null,
      },
    });
    return NextResponse.json({
      pending_id: pending.id,
      data: preview.data,
      source: preview.source,
      raw: preview.raw,
    });
  } catch (error) {
    await logServerError("manual_preview_failed", error, { endpoint: "manual/preview" });
    const detail = error instanceof Error ? error.message : "Nu am putut genera previzualizarea.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
