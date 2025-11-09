export type SummaryStats = {
  current_month: {
    total: number;
    count: number;
    average: number;
  };
  current_week: {
    total: number;
    count: number;
  };
  today: {
    total: number;
    count: number;
  };
  comparison_previous_month: {
    previous_total: number;
    change_amount: number;
    change_percentage: number;
    trend: "up" | "down" | "stable";
  };
};

export type CategoryBreakdown = {
  period: string;
  grand_total: number;
  categories: Array<{
    category_id: string;
    category_name: string;
    color?: string | null;
    icon?: string | null;
    total: number;
    count: number;
    percentage: number;
  }>;
};

export type TrendApiResponse = {
  type: string;
  range: number;
  data: Array<{
    date?: string;
    week_start?: string;
    week_end?: string;
    month?: string;
    total: number;
    count: number;
  }>;
};

export type TrendPoint = {
  label: string;
  subLabel?: string;
  total: number;
  count: number;
};

export type VendorStats = {
  period: string;
  grand_total: number;
  top_vendors: Array<{
    vendor: string;
    total: number;
    count: number;
    percentage: number;
  }>;
};

export type ExpenseResponse = {
  id: string;
  owner_user_id: string;
  source: string;
  amount: number;
  currency?: string | null;
  vendor?: string | null;
  purchase_date?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  ai_confidence?: number | null;
  created_at: string;
  decrypted_vendor?: string | null;
  vendor_fiscal_code?: string | null;
  vendor_registration_number?: string | null;
  vendor_address?: string | null;
};

export type ExpenseListResponse = {
  expenses: ExpenseResponse[];
  total: number;
};

export type CategoryResponse = {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  is_default?: boolean;
};

export type DashboardData = {
  summary: SummaryStats;
  categories: CategoryBreakdown;
  trend: TrendPoint[];
  vendors: VendorStats;
  recentExpenses: ExpenseResponse[];
};

export type ExpenseDetailResponse = ExpenseResponse & {
  json_data?: Record<string, unknown> | null;
};
