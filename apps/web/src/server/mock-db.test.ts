import { beforeEach, describe, expect, it } from "vitest";
import {
  computeCategoryBreakdown,
  confirmManualExpense,
  createCategory,
  deleteCategory,
  listCategories,
  listExpenseWithFilters,
  resetMockData,
  updateCategory,
} from "./mock-db";
import { generateManualPreview } from "./ai/manual-expense";

describe("data service (Prisma)", () => {
  beforeEach(async () => {
    await resetMockData();
  });

  it("adds, updates și șterge categorii custom", async () => {
    const created = await createCategory({ name: "Marketing", color: "#ff00ff" });
    expect(created.name).toBe("Marketing");

    const categories = await listCategories();
    expect(categories.some((cat) => cat.id === created.id)).toBe(true);

    const updated = await updateCategory(created.id, { icon: "📣" });
    expect(updated.icon).toBe("📣");

    await deleteCategory(created.id);
    const afterDelete = await listCategories();
    expect(afterDelete.some((cat) => cat.id === created.id)).toBe(false);
  });

  it("confirma o cheltuială manuală și o regăsește filtrată", async () => {
    const expense = await confirmManualExpense({
      parsed_data: {
        amount: 199.5,
        vendor: "Test Vendor",
        category: "Groceries",
      },
    });

    expect(expense.vendor).toBe("Test Vendor");

    const filtered = await listExpenseWithFilters({
      minAmount: 150,
      maxAmount: 250,
      categoryIds: expense.category_id ? [expense.category_id] : undefined,
    });
    expect(filtered.expenses.some((row) => row.id === expense.id)).toBe(true);
  });

  it("generează previzualizări AI pe baza textului introdus", async () => {
    const preview = await generateManualPreview("Am plătit 480 MDL la Linella ieri");
    expect(preview.data.amount).toBeGreaterThan(0);
    expect(preview.data.vendor?.length ?? 0).toBeGreaterThan(0);
    expect(preview.data.currency).toBeDefined();
  });

  it("calculează breakdown-ul pe categorii pentru intervale custom", async () => {
    const breakdown = await computeCategoryBreakdown({
      dateFrom: "2025-01-01",
      dateTo: "2025-01-10",
    });
    expect(breakdown.categories.length).toBeGreaterThan(0);
    expect(breakdown.grand_total).toBeGreaterThan(0);
  });
});
