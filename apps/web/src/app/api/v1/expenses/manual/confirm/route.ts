import { NextResponse } from "next/server";
import { confirmManualExpense } from "@/server/mock-db";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const expense = await confirmManualExpense(payload);
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Nu am putut salva cheltuiala.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
