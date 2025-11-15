import "server-only";

import { Prisma } from "@prisma/client";
import type {
  CategoryBreakdown,
  CategoryResponse,
  ExpenseDetailResponse,
  ExpenseListResponse,
  ExpenseResponse,
  SummaryStats,
  TrendApiResponse,
  VendorStats,
} from "@/lib/types";
import { ManualPreviewData } from "./ai/types";
import { prisma } from "./prisma";

type ExpenseFilters = {
  dateFrom?: string;
  dateTo?: string;
  categoryIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  skip?: number;
  sortBy?: "purchase_date" | "created_at" | "amount" | "vendor";
  order?: "asc" | "desc";
};

type CategorySuggestion = {
  name: string;
  color: string;
  icon: string;
};

const DEFAULT_CATEGORIES = [
  { id: "cat_groceries", name: "Groceries", color: "#34d399", icon: "🛒", isDefault: true },
  { id: "cat_transport", name: "Transport", color: "#60a5fa", icon: "🚗", isDefault: true },
  { id: "cat_restaurant", name: "Restaurant", color: "#f472b6", icon: "🍽️", isDefault: true },
  { id: "cat_household", name: "Household", color: "#facc15", icon: "🏠", isDefault: true },
  { id: "cat_entertainment", name: "Entertainment", color: "#c084fc", icon: "🎉", isDefault: true },
  { id: "cat_health", name: "Health", color: "#f87171", icon: "💊", isDefault: true },
  { id: "cat_custom_pets", name: "Pets", color: "#22d3ee", icon: "🐾", isDefault: false },
];

const DEFAULT_EXPENSES = [
  {
    id: "exp_linella_249",
    ownerId: "demo-user",
    source: "photo",
    amount: new Prisma.Decimal(249.9),
    currency: "MDL",
    vendor: "Linella",
    purchaseDate: new Date("2025-01-10T00:00:00Z"),
    aiConfidence: 0.94,
    categoryId: "cat_groceries",
    createdAt: new Date("2025-01-10T10:21:00Z"),
    metadata: {
      receipt_number: "LN-54821",
      payment_method: "Card Revolut",
      items: [
        { name: "Fructe & legume", qty: 5, price: 35.5, total: 177.5 },
        { name: "Lapte", qty: 2, price: 18.2, total: 36.4 },
        { name: "Cafea boabe", qty: 1, price: 35.99, total: 35.99 },
      ],
      notes: "Bon scanat automat cu Expense Bot AI",
    },
  },
  {
    id: "exp_starbucks_120",
    ownerId: "demo-user",
    source: "photo",
    amount: new Prisma.Decimal(120.5),
    currency: "MDL",
    vendor: "Starbucks",
    purchaseDate: new Date("2025-01-09T00:00:00Z"),
    aiConfidence: 0.89,
    categoryId: "cat_restaurant",
    createdAt: new Date("2025-01-09T08:05:00Z"),
    metadata: {
      receipt_number: "SBX-10293",
      items: [
        { name: "Latte", qty: 2, price: 55, total: 110 },
        { name: "Croissant", qty: 1, price: 10.5, total: 10.5 },
      ],
      notes: "Reuniune matinală cu clientul",
    },
  },
  {
    id: "exp_ikea_540",
    ownerId: "demo-user",
    source: "voice",
    amount: new Prisma.Decimal(540.1),
    currency: "MDL",
    vendor: "IKEA",
    purchaseDate: new Date("2025-01-08T00:00:00Z"),
    aiConfidence: 0.91,
    categoryId: "cat_household",
    createdAt: new Date("2025-01-08T17:30:00Z"),
    metadata: {
      receipt_number: "IK-28831",
      items: [
        { name: "Corp iluminat", qty: 2, price: 120.0, total: 240.0 },
        { name: "Organizatoare birou", qty: 3, price: 50.0, total: 150.0 },
        { name: "Diverse", qty: 1, price: 150.1, total: 150.1 },
      ],
      notes: "Descris folosind dictare vocală",
    },
  },
  {
    id: "exp_petrom_86",
    ownerId: "demo-user",
    source: "manual",
    amount: new Prisma.Decimal(86.4),
    currency: "MDL",
    vendor: "Petrom",
    purchaseDate: new Date("2025-01-08T00:00:00Z"),
    aiConfidence: 0.88,
    categoryId: "cat_transport",
    createdAt: new Date("2025-01-08T07:44:00Z"),
    metadata: {
      receipt_number: "PT-7721",
      items: [{ name: "Carburant 95", qty: 18, price: 4.8, total: 86.4 }],
      notes: "Realimentare traseu zilnic",
    },
  },
  {
    id: "exp_mega_410",
    ownerId: "demo-user",
    source: "photo",
    amount: new Prisma.Decimal(410.5),
    currency: "MDL",
    vendor: "Mega Image",
    purchaseDate: new Date("2025-01-07T00:00:00Z"),
    aiConfidence: 0.9,
    categoryId: "cat_entertainment",
    createdAt: new Date("2025-01-07T12:10:00Z"),
    metadata: {
      receipt_number: "MG-77121",
      items: [
        { name: "Set cadou", qty: 1, price: 210.5, total: 210.5 },
        { name: "Vin", qty: 2, price: 100, total: 200 },
      ],
      notes: "Cadouri pentru parteneri",
    },
  },
  {
    id: "exp_linella_190",
    ownerId: "demo-user",
    source: "manual",
    amount: new Prisma.Decimal(190.75),
    currency: "MDL",
    vendor: "Linella",
    purchaseDate: new Date("2025-01-06T00:00:00Z"),
    aiConfidence: 0.85,
    categoryId: "cat_groceries",
    createdAt: new Date("2025-01-06T14:42:00Z"),
    metadata: {
      receipt_number: "LN-54789",
      items: [
        { name: "Snacks", qty: 10, price: 10, total: 100 },
        { name: "Apă", qty: 6, price: 7.5, total: 45 },
        { name: "Cafea", qty: 1, price: 45.75, total: 45.75 },
      ],
      notes: "Reaprovizionare bucătărie",
    },
  },
  {
    id: "exp_uber_64",
    ownerId: "demo-user",
    source: "manual",
    amount: new Prisma.Decimal(64.3),
    currency: "MDL",
    vendor: "Uber",
    purchaseDate: new Date("2025-01-05T00:00:00Z"),
    aiConfidence: 0.76,
    categoryId: "cat_transport",
    createdAt: new Date("2025-01-05T19:15:00Z"),
    metadata: {
      receipt_number: "UB-0031",
      items: [{ name: "Ride", qty: 1, price: 64.3, total: 64.3 }],
      notes: "Transfer aeroport",
    },
  },
  {
    id: "exp_gym_330",
    ownerId: "demo-user",
    source: "manual",
    amount: new Prisma.Decimal(330),
    currency: "MDL",
    vendor: "Oxygen Fitness",
    purchaseDate: new Date("2025-01-04T00:00:00Z"),
    aiConfidence: 0.72,
    categoryId: "cat_health",
    createdAt: new Date("2025-01-04T07:15:00Z"),
    metadata: {
      receipt_number: "GYM-221",
      items: [{ name: "Abonament lunar", qty: 1, price: 330, total: 330 }],
      notes: "Abonament echipă",
    },
  },
  {
    id: "exp_vet_780",
    ownerId: "demo-user",
    source: "photo",
    amount: new Prisma.Decimal(780),
    currency: "MDL",
    vendor: "Happy Vet",
    purchaseDate: new Date("2025-01-03T00:00:00Z"),
    aiConfidence: 0.83,
    categoryId: "cat_custom_pets",
    createdAt: new Date("2025-01-03T16:20:00Z"),
    metadata: {
      receipt_number: "HV-881",
      items: [
        { name: "Consultație", qty: 1, price: 250, total: 250 },
        { name: "Vaccin", qty: 1, price: 300, total: 300 },
        { name: "Tratamente", qty: 1, price: 230, total: 230 },
      ],
      notes: "Vizită clinică",
    },
  },
  {
    id: "exp_netflix_199",
    ownerId: "demo-user",
    source: "manual",
    amount: new Prisma.Decimal(199),
    currency: "MDL",
    vendor: "Netflix",
    purchaseDate: new Date("2025-01-02T00:00:00Z"),
    aiConfidence: 0.7,
    categoryId: "cat_entertainment",
    createdAt: new Date("2025-01-02T08:00:00Z"),
    metadata: {
      receipt_number: "NF-2025-01",
      items: [{ name: "Abonament Premium", qty: 1, price: 199, total: 199 }],
      notes: "Abonament echipă marketing",
    },
  },
  {
    id: "exp_airmoldova_2480",
    ownerId: "demo-user",
    source: "voice",
    amount: new Prisma.Decimal(2480),
    currency: "MDL",
    vendor: "Air Moldova",
    purchaseDate: new Date("2025-01-01T00:00:00Z"),
    aiConfidence: 0.78,
    categoryId: "cat_transport",
    createdAt: new Date("2025-01-01T13:00:00Z"),
    metadata: {
      receipt_number: "FL-9088",
      items: [
        { name: "Bilet Chișinău-București", qty: 1, price: 1240, total: 1240 },
        { name: "Bilet retur", qty: 1, price: 1240, total: 1240 },
      ],
      notes: "Călătorie business",
    },
  },
];

const COLOR_SUGGESTIONS = ["#34d399", "#22d3ee", "#f97316", "#f472b6", "#a855f7", "#facc15", "#38bdf8", "#94a3b8", "#f43f5e", "#0ea5e9"];
const ICON_SUGGESTIONS = ["💼", "🍔", "🏠", "🎉", "🛒", "🚗", "💡", "💊", "🎁", "✈️", "📚", "🐾", "🧖", "🎮", "📱", "🧾"];
const KEYWORD_CATEGORY_MAP: Array<{ keyword: RegExp; suggestion: CategorySuggestion }> = [
  { keyword: /(food|mancare|grocer|market|linella|cora|carrefour)/i, suggestion: { name: "Groceries", color: "#34d399", icon: "🛒" } },
  { keyword: /(transport|uber|taxi|fuel|benzina|flight|air)/i, suggestion: { name: "Transport", color: "#60a5fa", icon: "🚗" } },
  { keyword: /(restaurant|cafe|coffee|starbucks|meal|pranz)/i, suggestion: { name: "Restaurant", color: "#f472b6", icon: "🍽️" } },
  { keyword: /(health|clinic|medical|abonament|gym|fitness|doctor)/i, suggestion: { name: "Health", color: "#f87171", icon: "💊" } },
  { keyword: /(pet|animal|vet)/i, suggestion: { name: "Pets", color: "#22d3ee", icon: "🐾" } },
  { keyword: /(soft|subscription|saas|licence|abonament)/i, suggestion: { name: "Software", color: "#a855f7", icon: "💻" } },
];

let dbInitialized = false;
let seeded = false;

async function ensureDatabaseSetup() {
  if (dbInitialized) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Category" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "color" TEXT,
      "icon" TEXT,
      "isDefault" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Expense" (
      "id" TEXT PRIMARY KEY,
      "ownerId" TEXT NOT NULL,
      "source" TEXT NOT NULL,
      "amount" DECIMAL NOT NULL DEFAULT 0,
      "currency" TEXT NOT NULL DEFAULT 'MDL',
      "vendor" TEXT,
      "purchaseDate" DATETIME,
      "aiConfidence" REAL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "categoryId" TEXT,
      "metadata" TEXT,
      CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Expense_category_idx" ON "Expense"("categoryId");`);
  dbInitialized = true;
}

async function ensureSeedData() {
  await ensureDatabaseSetup();
  if (seeded) return;
  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    await prisma.category.createMany({ data: DEFAULT_CATEGORIES });
  }
  const expenseCount = await prisma.expense.count();
  if (expenseCount === 0) {
    await prisma.expense.createMany({ data: DEFAULT_EXPENSES });
  }
  seeded = true;
}

const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const normalizeDateKey = (value?: string | Date | null) => {
  if (!value) return undefined;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
};

const parseDateKey = (value: string) => new Date(`${value}T00:00:00Z`);
const addDays = (value: string, delta: number) => {
  const date = parseDateKey(value);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
};
const startOfMonth = (value: string) => {
  const date = parseDateKey(value);
  date.setUTCDate(1);
  return date.toISOString().slice(0, 10);
};
const endOfMonth = (value: string) => {
  const date = parseDateKey(value);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return date.toISOString().slice(0, 10);
};
const startOfWeek = (value: string) => {
  const date = parseDateKey(value);
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().slice(0, 10);
};

type ExpenseWithCategory = Prisma.ExpenseGetPayload<{ include: { category: true } }>;

const toExpenseResponse = (expense?: ExpenseWithCategory | null) => {
  if (!expense) return null;
  const purchaseKey = normalizeDateKey(expense.purchaseDate);
  return {
    id: expense.id,
    owner_user_id: expense.ownerId,
    source: expense.source,
    amount: Number(expense.amount),
    currency: expense.currency,
    vendor: expense.vendor,
    purchase_date: purchaseKey ?? null,
    category_id: expense.categoryId,
    category_name: expense.category?.name ?? null,
    ai_confidence: expense.aiConfidence ?? null,
    created_at: expense.createdAt.toISOString(),
    decrypted_vendor: expense.vendor,
    vendor_address: null,
    vendor_fiscal_code: null,
    vendor_registration_number: null,
  } satisfies ExpenseResponse;
};

const toCategoryResponse = (category: { id: string; name: string; color: string | null; icon: string | null; isDefault: boolean }): CategoryResponse => ({
  id: category.id,
  name: category.name,
  color: category.color,
  icon: category.icon,
  is_default: category.isDefault,
});

async function findCategoryByNameInsensitive(name: string) {
  const lower = name.trim().toLowerCase();
  const categories = await prisma.category.findMany({ select: { id: true, name: true, color: true, icon: true, isDefault: true } });
  return categories.find((category) => category.name.toLowerCase() === lower) ?? null;
}

export async function listCategories() {
  await ensureSeedData();
  const categories = await prisma.category.findMany({ orderBy: { createdAt: "desc" } });
  return categories.map(toCategoryResponse);
}

export async function createCategory(payload: { name?: string; color?: string; icon?: string }) {
  await ensureSeedData();
  const name = payload.name?.trim();
  if (!name) {
    throw new Error("Completează denumirea categoriei.");
  }
  const existing = await findCategoryByNameInsensitive(name);
  if (existing) {
    throw new Error("Există deja o categorie cu această denumire.");
  }
  const category = await prisma.category.create({
    data: {
      name,
      color: payload.color ?? pickRandom(COLOR_SUGGESTIONS),
      icon: payload.icon ?? pickRandom(ICON_SUGGESTIONS),
      isDefault: false,
    },
  });
  return toCategoryResponse(category);
}

export async function updateCategory(id: string, payload: { name?: string; color?: string; icon?: string }) {
  await ensureSeedData();
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new Error("Categoria nu există.");
  }
  if (payload.name) {
    const exists = await findCategoryByNameInsensitive(payload.name);
    if (exists && exists.id !== id) {
      throw new Error("Există deja o categorie cu această denumire.");
    }
  }
  const updated = await prisma.category.update({
    where: { id },
    data: {
      name: payload.name?.trim() ?? category.name,
      color: payload.color ?? category.color,
      icon: payload.icon ?? category.icon,
    },
  });
  return toCategoryResponse(updated);
}

export async function deleteCategory(id: string) {
  await ensureSeedData();
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new Error("Categoria nu există.");
  }
  if (category.isDefault) {
    throw new Error("Nu poți șterge o categorie implicită.");
  }
  await prisma.category.delete({ where: { id } });
  await prisma.expense.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
}

export async function findCategory(id: string) {
  await ensureSeedData();
  const category = await prisma.category.findUnique({ where: { id } });
  return category ? toCategoryResponse(category) : null;
}

export function suggestCategory(description: string): CategorySuggestion {
  const normalized = description.trim();
  const match = KEYWORD_CATEGORY_MAP.find(({ keyword }) => keyword.test(normalized));
  if (match) {
    return match.suggestion;
  }
  const fallbackName = normalized
    .split(" ")
    .slice(0, 2)
    .join(" ")
    .trim() || "Categorie personalizată";
  return {
    name: fallbackName,
    color: pickRandom(COLOR_SUGGESTIONS),
    icon: pickRandom(ICON_SUGGESTIONS),
  };
}

const mapOrder = (field?: string, order?: string): Prisma.ExpenseOrderByWithRelationInput => {
  const direction: Prisma.SortOrder = order === "asc" ? "asc" : "desc";
  switch (field) {
    case "amount":
      return { amount: direction };
    case "vendor":
      return { vendor: direction };
    case "created_at":
      return { createdAt: direction };
    default:
      return { purchaseDate: direction };
  }
};

export async function listExpenseWithFilters(filters: ExpenseFilters = {}): Promise<ExpenseListResponse> {
  await ensureSeedData();
  const where: Prisma.ExpenseWhereInput = {};
  if (filters.categoryIds?.length) {
    where.categoryId = { in: filters.categoryIds };
  }
  if (filters.dateFrom || filters.dateTo) {
    where.purchaseDate = {};
    if (filters.dateFrom) {
      where.purchaseDate.gte = new Date(`${filters.dateFrom}T00:00:00Z`);
    }
    if (filters.dateTo) {
      where.purchaseDate.lte = new Date(`${filters.dateTo}T23:59:59Z`);
    }
  }
  if (typeof filters.minAmount === "number" || typeof filters.maxAmount === "number") {
    where.amount = {};
    if (filters.minAmount !== undefined) {
      where.amount.gte = new Prisma.Decimal(filters.minAmount);
    }
    if (filters.maxAmount !== undefined) {
      where.amount.lte = new Prisma.Decimal(filters.maxAmount);
    }
  }
  const limit = filters.limit ?? 100;
  const skip = filters.skip ?? 0;
  const orderBy = mapOrder(filters.sortBy, filters.order);
  const [rows, total] = await prisma.$transaction([
    prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy,
      take: limit,
      skip,
    }),
    prisma.expense.count({ where }),
  ]);
  return {
    expenses: rows.map((expense) => toExpenseResponse(expense)!) as ExpenseResponse[],
    total,
  };
}

export async function getExpenseDetail(id: string): Promise<ExpenseDetailResponse | null> {
  await ensureSeedData();
  const expense = await prisma.expense.findUnique({ where: { id }, include: { category: true } });
  if (!expense) {
    return null;
  }
  const base = toExpenseResponse(expense) as ExpenseDetailResponse;
  base.json_data = expense.metadata as Record<string, unknown> | null;
  return base;
}

export async function updateExpenseRecord(
  id: string,
  payload: Partial<{ vendor: string; amount: number; category_id: string | null; purchase_date: string; currency: string }>
) {
  await ensureSeedData();
  const data: Prisma.ExpenseUpdateInput = {};
  if (payload.vendor !== undefined) {
    if (!payload.vendor.trim()) {
      throw new Error("Denumirea nu poate fi goală.");
    }
    data.vendor = payload.vendor.trim();
  }
  if (payload.amount !== undefined) {
    if (Number.isNaN(payload.amount)) {
      throw new Error("Suma nu este validă.");
    }
    data.amount = new Prisma.Decimal(payload.amount);
  }
  if (payload.category_id !== undefined) {
    if (payload.category_id) {
      const category = await prisma.category.findUnique({ where: { id: payload.category_id } });
      if (!category) {
        throw new Error("Categoria selectată nu există.");
      }
      data.category = { connect: { id: payload.category_id } };
    } else {
      data.category = { disconnect: true };
    }
  }
  if (payload.purchase_date) {
    data.purchaseDate = new Date(`${payload.purchase_date}T00:00:00Z`);
  }
  if (payload.currency) {
    data.currency = payload.currency;
  }
  const updated = await prisma.expense.update({ where: { id }, data, include: { category: true } });
  return toExpenseResponse(updated) as ExpenseResponse;
}

export async function deleteExpenseRecord(id: string) {
  await ensureSeedData();
  await prisma.expense.delete({ where: { id } });
}

export async function confirmManualExpense(payload: { source?: string; parsed_data?: ManualPreviewData }) {
  await ensureSeedData();
  if (!payload?.parsed_data) {
    throw new Error("Lipsește conținutul cheltuielii.");
  }
  const { amount, currency, vendor, purchase_date, category, notes, items } = payload.parsed_data;
  if (amount === undefined) {
    throw new Error("Nu am putut detecta suma.");
  }
  const normalizedVendor = vendor?.trim() || "Cheltuială manuală";
  const normalizedCurrency = currency || "MDL";
  const dateKey = purchase_date || new Date().toISOString().slice(0, 10);
  let categoryId: string | null = null;
  if (category) {
    const existing = await findCategoryByNameInsensitive(category);
    if (existing) {
      categoryId = existing.id;
    }
  }
  const created = await prisma.expense.create({
    data: {
      ownerId: "demo-user",
      source: payload.source || "manual",
      amount: new Prisma.Decimal(Number(amount.toFixed(2))),
      currency: normalizedCurrency,
      vendor: normalizedVendor,
      purchaseDate: new Date(`${dateKey}T00:00:00Z`),
      categoryId,
      aiConfidence: 0.72,
      metadata: {
        notes: notes || `Adăugată manual la ${new Date().toISOString()}`,
        items: items?.length
          ? items
          : [
              {
                name: normalizedVendor,
                qty: 1,
                price: Number(amount.toFixed(2)),
                total: Number(amount.toFixed(2)),
              },
            ],
      },
    },
    include: { category: true },
  });
  return toExpenseResponse(created) as ExpenseResponse;
}

function sumAmounts(expenses: Array<{ amount: Prisma.Decimal | number }>) {
  return expenses.reduce((total, expense) => total + Number(expense.amount ?? 0), 0);
}

type DateFilters = { dateFrom?: string; dateTo?: string };

async function fetchExpensesForWindow(filters: DateFilters) {
  const where: Prisma.ExpenseWhereInput = {};
  if (filters.dateFrom || filters.dateTo) {
    where.purchaseDate = {};
    if (filters.dateFrom) {
      where.purchaseDate.gte = new Date(`${filters.dateFrom}T00:00:00Z`);
    }
    if (filters.dateTo) {
      where.purchaseDate.lte = new Date(`${filters.dateTo}T23:59:59Z`);
    }
  }
  const expenses = await prisma.expense.findMany({ where, include: { category: true } });
  return expenses;
}

export async function computeCategoryBreakdown(filters: {
  dateFrom?: string;
  dateTo?: string;
  periodLabel?: string;
}): Promise<CategoryBreakdown> {
  await ensureSeedData();
  const expenses = await fetchExpensesForWindow(filters);
  const totals = new Map<string, { total: number; count: number; category?: { id: string | null; name: string | null; color: string | null; icon: string | null } }>();
  expenses.forEach((expense) => {
    const key = expense.categoryId ?? "uncategorized";
    if (!totals.has(key)) {
      totals.set(key, {
        total: 0,
        count: 0,
        category: {
          id: expense.categoryId ?? null,
          name: expense.category?.name ?? "Fără categorie",
          color: expense.category?.color ?? "#94a3b8",
          icon: expense.category?.icon ?? "🏷️",
        },
      });
    }
    const bucket = totals.get(key)!;
    bucket.total += Number(expense.amount ?? 0);
    bucket.count += 1;
  });
  const grand_total = sumAmounts(expenses);
  const categories = Array.from(totals.entries())
    .map(([categoryId, data]) => ({
      category_id: data.category?.id ?? categoryId,
      category_name: data.category?.name ?? "Fără categorie",
      color: data.category?.color ?? "#94a3b8",
      icon: data.category?.icon ?? "🏷️",
      total: Number(data.total.toFixed(2)),
      count: data.count,
      percentage: grand_total > 0 ? Number(((data.total / grand_total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);
  return {
    period:
      filters.periodLabel ||
      (filters.dateFrom && filters.dateTo
        ? `${filters.dateFrom} → ${filters.dateTo}`
        : filters.dateFrom || filters.dateTo || "all"),
    grand_total: Number(grand_total.toFixed(2)),
    categories,
  };
}

export async function computeVendorStats(filters: {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  periodLabel?: string;
}): Promise<VendorStats> {
  await ensureSeedData();
  const expenses = await fetchExpensesForWindow(filters);
  const map = new Map<string, { total: number; count: number }>();
  expenses.forEach((expense) => {
    const key = expense.vendor || "Fără denumire";
    if (!map.has(key)) {
      map.set(key, { total: 0, count: 0 });
    }
    const bucket = map.get(key)!;
    bucket.total += Number(expense.amount ?? 0);
    bucket.count += 1;
  });
  const grand_total = sumAmounts(expenses);
  const limit = filters.limit ?? 5;
  const top_vendors = Array.from(map.entries())
    .map(([vendor, data]) => ({
      vendor,
      total: Number(data.total.toFixed(2)),
      count: data.count,
      percentage: grand_total > 0 ? Number(((data.total / grand_total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
  return {
    period:
      filters.periodLabel ||
      (filters.dateFrom && filters.dateTo
        ? `${filters.dateFrom} → ${filters.dateTo}`
        : filters.dateFrom || filters.dateTo || "all"),
    grand_total: Number(grand_total.toFixed(2)),
    top_vendors,
  };
}

function resolveTargetDate(targetDate?: string, dateFrom?: string, dateTo?: string) {
  if (targetDate) return targetDate;
  if (dateTo) return dateTo;
  if (dateFrom) return dateFrom;
  return new Date().toISOString().slice(0, 10);
}

export async function computeTrend(filters: {
  trendType?: string;
  rangeValue?: number;
  targetDate?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TrendApiResponse> {
  await ensureSeedData();
  const clampedRange = Math.max(2, Math.min(filters.rangeValue ?? 10, 90));
  const target = resolveTargetDate(filters.targetDate, filters.dateFrom, filters.dateTo);
  const start = filters.dateFrom ?? addDays(target, -(clampedRange - 1));
  const data: TrendApiResponse["data"] = [];
  for (let index = 0; index < clampedRange; index += 1) {
    const day = addDays(start, index);
    if (filters.dateTo && day > filters.dateTo) {
      break;
    }
    const expenses = await fetchExpensesForWindow({ dateFrom: day, dateTo: day });
    data.push({
      date: day,
      total: Number(sumAmounts(expenses).toFixed(2)),
      count: expenses.length,
    });
  }
  return {
    type: filters.trendType ?? "daily",
    range: clampedRange,
    data,
  };
}

export async function computeSummary(filters: {
  dateFrom?: string;
  dateTo?: string;
  targetDate?: string;
}): Promise<SummaryStats> {
  await ensureSeedData();
  const target = resolveTargetDate(filters.targetDate, filters.dateFrom, filters.dateTo);
  const monthStart = filters.dateFrom ?? startOfMonth(target);
  const monthEnd = filters.dateTo ?? endOfMonth(target);
  const weekStartKey = filters.dateFrom ?? startOfWeek(target);
  const weekEndKey = filters.dateTo ?? target;
  const todayKey = target;
  const previousMonthStart = startOfMonth(addDays(target, -30));
  const previousMonthEnd = endOfMonth(addDays(target, -30));

  const [monthExpenses, weekExpenses, todayExpenses, previousMonthExpenses] = await Promise.all([
    fetchExpensesForWindow({ dateFrom: monthStart, dateTo: monthEnd }),
    fetchExpensesForWindow({ dateFrom: weekStartKey, dateTo: weekEndKey }),
    fetchExpensesForWindow({ dateFrom: todayKey, dateTo: todayKey }),
    fetchExpensesForWindow({ dateFrom: previousMonthStart, dateTo: previousMonthEnd }),
  ]);

  const monthTotal = sumAmounts(monthExpenses);
  const previousTotal = sumAmounts(previousMonthExpenses);
  const changeAmount = monthTotal - previousTotal;
  const changePercentage = previousTotal
    ? Number(((changeAmount / previousTotal) * 100).toFixed(1))
    : 100;
  const trend: SummaryStats["comparison_previous_month"]["trend"] =
    changeAmount > 0 ? "up" : changeAmount < 0 ? "down" : "stable";

  return {
    current_month: {
      total: Number(monthTotal.toFixed(2)),
      count: monthExpenses.length,
      average:
        monthExpenses.length > 0
          ? Number((monthTotal / monthExpenses.length).toFixed(2))
          : 0,
    },
    current_week: {
      total: Number(sumAmounts(weekExpenses).toFixed(2)),
      count: weekExpenses.length,
    },
    today: {
      total: Number(sumAmounts(todayExpenses).toFixed(2)),
      count: todayExpenses.length,
    },
    comparison_previous_month: {
      previous_total: Number(previousTotal.toFixed(2)),
      change_amount: Number(changeAmount.toFixed(2)),
      change_percentage: changePercentage,
      trend,
    },
  };
}

export async function resetMockData() {
  await ensureDatabaseSetup();
  await prisma.expense.deleteMany();
  await prisma.category.deleteMany();
  seeded = false;
  await ensureSeedData();
}
