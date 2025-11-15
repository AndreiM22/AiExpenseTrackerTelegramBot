import { NextResponse } from "next/server";
import { computeCategoryBreakdown } from "@/server/mock-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const breakdown = await computeCategoryBreakdown({
      dateFrom: searchParams.get("date_from") || undefined,
      dateTo: searchParams.get("date_to") || undefined,
      periodLabel: searchParams.get("period") || undefined,
    });
    return NextResponse.json(breakdown);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Nu am putut încărca statisticile pe categorii.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
