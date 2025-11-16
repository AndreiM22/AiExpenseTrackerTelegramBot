import { DashboardShell } from "@/components/layout/DashboardShell";
import { CategoriesTable } from "@/components/categories/CategoriesTable";
import { listCategories, computeCategoryBreakdown } from "@/server/mock-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getCategoriesData() {
  const [categories, stats] = await Promise.all([
    listCategories(),
    computeCategoryBreakdown({}), // No date filter = all time
  ]);

  const statsMap = new Map<
    string,
    { total: number; count: number }
  >();

  stats?.categories.forEach((cat) => {
    statsMap.set(cat.category_id, {
      total: cat.total,
      count: cat.count,
    });
  });

  const formatted =
    categories?.map((cat) => ({
      ...cat,
      total_expenses: statsMap.get(cat.id)?.count || 0,
      total_amount: statsMap.get(cat.id)?.total || 0,
    })) || [];

  return formatted;
}

export default async function CategoriesPage() {
  const categories = await getCategoriesData();
  const userName = "Expense Admin";

  return (
    <DashboardShell userName={userName}>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Management
          </p>
          <h1 className="text-2xl font-semibold text-white">Categorii</h1>
          <p className="text-sm text-white/60">
            Administrează categoriile implicite și custom, personalizează
            culoarea/iconița și organizează cheltuielile rapid.
          </p>
        </div>
        <CategoriesTable categories={categories} />
      </div>
    </DashboardShell>
  );
}
