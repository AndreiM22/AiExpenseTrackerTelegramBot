import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard-data";

export const metadata = {
  title: "Statistics - Expense Tracker",
  description: "View detailed expense statistics and insights",
};

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground mt-2">
          Detailed insights into your spending patterns
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            This Month
          </div>
          <div className="mt-2 text-3xl font-bold">
            {data.summary.current_month.total.toFixed(2)} MDL
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {data.summary.current_month.count} transactions
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            This Week
          </div>
          <div className="mt-2 text-3xl font-bold">
            {data.summary.current_week.total.toFixed(2)} MDL
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {data.summary.current_week.count} transactions
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Today</div>
          <div className="mt-2 text-3xl font-bold">
            {data.summary.today.total.toFixed(2)} MDL
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {data.summary.today.count} transactions
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Spending by Category</h2>
        <div className="space-y-4">
          {data.categories.categories.map((cat) => (
            <div key={cat.category_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color || "#gray" }}
                  />
                  <span className="font-medium">{cat.category_name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {cat.count} items
                  </span>
                  <span className="font-semibold">{cat.total.toFixed(2)} MDL</span>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color || "#gray",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Vendors */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Top Vendors</h2>
        <div className="space-y-3">
          {data.vendors.top_vendors.map((vendor, idx) => (
            <div
              key={vendor.vendor}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {idx + 1}
                </div>
                <span className="font-medium">{vendor.vendor}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {vendor.count} visits
                </span>
                <span className="font-semibold w-24 text-right">
                  {vendor.total.toFixed(2)} MDL
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Chart Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Spending Trend</h2>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <p>Chart visualization coming soon...</p>
        </div>
      </div>
    </div>
  );
}
