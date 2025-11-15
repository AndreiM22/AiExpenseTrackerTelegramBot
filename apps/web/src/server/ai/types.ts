export type ManualPreviewItem = {
  name?: string;
  qty?: number | string;
  price?: number | string;
  total?: number | string;
};

export type ManualPreviewData = {
  amount?: number;
  currency?: string;
  vendor?: string;
  purchase_date?: string;
  category?: string;
  notes?: string;
  items?: ManualPreviewItem[];
};
