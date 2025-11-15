import { NextResponse } from "next/server";
import { listExpenseWithFilters } from "@/server/mock-db";

const parseNumberParam = (value: string | null) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const limit = parseNumberParam(searchParams.get("limit")) ?? 100;
    const skip = parseNumberParam(searchParams.get("skip")) ?? 0;
    const categoryIds = searchParams.getAll("category_id");
    const filters = {
      dateFrom: searchParams.get("date_from") || undefined,
      dateTo: searchParams.get("date_to") || undefined,
      categoryIds: categoryIds.length ? categoryIds : undefined,
      minAmount: parseNumberParam(searchParams.get("min_amount")),
      maxAmount: parseNumberParam(searchParams.get("max_amount")),
      limit,
      skip,
      sortBy:
        (searchParams.get("sort_by") as
          | "purchase_date"
          | "created_at"
          | "amount"
          | "vendor"
          | null) ?? "purchase_date",
      order:
        (searchParams.get("order") as "asc" | "desc" | null) ?? "desc",
    } as const;
    const data = await listExpenseWithFilters(filters);
    return NextResponse.json(data);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Nu am putut încărca tranzacțiile.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
