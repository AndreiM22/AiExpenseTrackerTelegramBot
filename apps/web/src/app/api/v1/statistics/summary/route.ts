import { NextResponse } from "next/server";
import { computeSummary } from "@/server/mock-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const summary = await computeSummary({
      dateFrom: searchParams.get("date_from") || undefined,
      dateTo: searchParams.get("date_to") || undefined,
      targetDate: searchParams.get("target_date") || undefined,
    });
    return NextResponse.json(summary);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Nu am putut calcula statisticile.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
