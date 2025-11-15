import { NextResponse } from "next/server";
import { createCategory, listCategories } from "@/server/mock-db";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const category = await createCategory(payload);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Nu am putut crea categoria.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
