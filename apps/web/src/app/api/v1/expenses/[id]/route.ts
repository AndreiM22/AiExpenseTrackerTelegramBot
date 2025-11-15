import { NextResponse } from "next/server";
import {
  deleteExpenseRecord,
  getExpenseDetail,
  updateExpenseRecord,
} from "@/server/mock-db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const expense = await getExpenseDetail(id);
  if (!expense) {
    return NextResponse.json({ detail: "Tranzacția nu există." }, { status: 404 });
  }
  return NextResponse.json(expense);
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = await request.json().catch(() => ({}));
    const updated = await updateExpenseRecord(id, payload);
    return NextResponse.json(updated);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Nu am putut actualiza tranzacția.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteExpenseRecord(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Nu am putut șterge tranzacția.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
