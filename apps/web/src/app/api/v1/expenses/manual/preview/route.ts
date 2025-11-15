import { NextResponse } from "next/server";
import { generateManualPreview } from "@/server/ai/manual-expense";
import { listCategories } from "@/server/mock-db";

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
    return NextResponse.json(preview);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Nu am putut genera previzualizarea.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
