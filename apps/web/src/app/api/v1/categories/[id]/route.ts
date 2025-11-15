import { NextResponse } from "next/server";
import {
  deleteCategory,
  findCategory,
  updateCategory,
} from "@/server/mock-db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const category = await findCategory(id);
  if (!category) {
    return NextResponse.json({ detail: "Categoria nu există." }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = await request.json().catch(() => ({}));
    const updated = await updateCategory(id, payload);
    return NextResponse.json(updated);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Nu am putut actualiza categoria.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Nu am putut șterge categoria.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
