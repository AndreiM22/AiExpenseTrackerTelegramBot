import { NextResponse } from "next/server";
import { computeVendorStats } from "@/server/mock-db";

const parseNumberParam = (value: string | null) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const stats = await computeVendorStats({
      dateFrom: searchParams.get("date_from") || undefined,
      dateTo: searchParams.get("date_to") || undefined,
      limit: parseNumberParam(searchParams.get("limit")),
      periodLabel: searchParams.get("period") || undefined,
    });
    return NextResponse.json(stats);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Nu am putut încărca topul vendorilor.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
