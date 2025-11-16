import { DashboardShell } from "@/components/layout/DashboardShell";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import type {
  CategoryResponse,
  ExpenseResponse,
} from "@/lib/types";
import { listCategories, listExpenseWithFilters } from "@/server/mock-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getTransactionsData(): Promise<{
  expenses: ExpenseResponse[];
  categories: CategoryResponse[];
}> {
  const [expensesData, categories] = await Promise.all([
    listExpenseWithFilters({
      limit: 200,
      sortBy: "purchase_date",
      order: "desc",
    }),
    listCategories(),
  ]);

  return {
    expenses: expensesData.expenses ?? [],
    categories: categories ?? [],
  };
}

export default async function TransactionsPage() {
  const { expenses, categories } = await getTransactionsData();
  const userName = "Expense Admin";

  return (
    <DashboardShell userName={userName}>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Management
          </p>
          <h1 className="text-2xl font-semibold text-white">Tranzacții</h1>
          <p className="text-sm text-white/60">
            Vizualizează și editează toate cheltuielile înregistrate prin bot.
          </p>
        </div>
        <TransactionsTable expenses={expenses} categories={categories} />
      </div>
    </DashboardShell>
  );
}
