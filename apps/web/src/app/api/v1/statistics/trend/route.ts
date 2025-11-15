import { NextResponse } from "next/server";
import { computeTrend } from "@/server/mock-db";

const parseNumberParam = (value: string | null) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const trend = await computeTrend({
      trendType: searchParams.get("trend_type") || undefined,
      rangeValue: parseNumberParam(searchParams.get("range_value")),
      targetDate: searchParams.get("target_date") || undefined,
      dateFrom: searchParams.get("date_from") || undefined,
      dateTo: searchParams.get("date_to") || undefined,
    });
    return NextResponse.json(trend);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Nu am putut genera evoluția.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
