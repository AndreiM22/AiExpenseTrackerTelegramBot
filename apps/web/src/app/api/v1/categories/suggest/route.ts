import { NextResponse } from "next/server";
import { suggestCategory } from "@/server/mock-db";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const description = String(payload.description ?? "").trim();
    if (!description) {
      return NextResponse.json(
        { detail: "Descrie categoria înainte de a cere o sugestie." },
        { status: 400 }
      );
    }
    const suggestion = suggestCategory(description);
    return NextResponse.json(suggestion);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Nu am putut genera sugestia.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
