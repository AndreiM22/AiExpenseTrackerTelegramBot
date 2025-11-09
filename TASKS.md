# TASKS - Web Dashboard Development

## STATUS ENDPOINTS BACKEND

### ✅ ENDPOINTS EXISTENTE:
```
POST   /api/v1/expenses/photo          ✅ Există
POST   /api/v1/expenses/voice          ✅ Există
POST   /api/v1/expenses/manual         ✅ Există
GET    /api/v1/expenses                ✅ Există (basic - lipsesc filters)
GET    /api/v1/categories              ✅ Există
POST   /api/v1/categories              ✅ Există
GET    /api/v1/categories/{id}         ✅ Există
PUT    /api/v1/categories/{id}         ✅ Există
DELETE /api/v1/categories/{id}         ✅ Există
```

### ❌ ENDPOINTS LIPSĂ (TREBUIE CREATE):
```
GET    /api/v1/expenses/{id}                    ❌ Lipsește - detalii expense
PUT    /api/v1/expenses/{id}                    ❌ Lipsește - update expense
DELETE /api/v1/expenses/{id}                    ❌ Lipsește - delete expense
GET    /api/v1/expenses/{id}/receipt            ❌ Lipsește - get receipt image
GET    /api/v1/statistics/summary               ❌ Lipsește - statistici sumare
GET    /api/v1/statistics/by_category           ❌ Lipsește - group by category
GET    /api/v1/statistics/by_vendor             ❌ Lipsește - top vendors
GET    /api/v1/statistics/trend                 ❌ Lipsește - trend în timp
GET    /api/v1/statistics/comparison            ❌ Lipsește - comparații perioade
GET    /api/v1/expenses/export/csv              ❌ Lipsește - export CSV
GET    /api/v1/expenses/export/pdf              ❌ Lipsește - export PDF
```

### ⚠️ ENDPOINTS DE ÎMBUNĂTĂȚIT:
```
GET    /api/v1/expenses                         ⚠️ Există dar lipsesc:
                                                   - Filtrare după dată (date_from, date_to)
                                                   - Filtrare după categorie
                                                   - Filtrare după sumă (min_amount, max_amount)
                                                   - Sortare (sort_by, order)
                                                   - Search în vendor
```

---

## PARTEA 1: BACKEND API (Prioritate CRITICĂ)

### TASK 1.1: Îmbunătățire GET /api/v1/expenses (Filtrare & Sortare)
**Fișier:** `app/api/expenses.py`
**Durată:** 2-3 ore

**Subtaskuri:**
- [ ] 1.1.1 Adaugă parametri query: `date_from`, `date_to`, `category_id`, `min_amount`, `max_amount`, `sort_by`, `order`, `search`
- [ ] 1.1.2 Implementează filtrare după interval de date
- [ ] 1.1.3 Implementează filtrare după categorie
- [ ] 1.1.4 Implementează filtrare după sumă (range)
- [ ] 1.1.5 Implementează search în vendor (ILIKE)
- [ ] 1.1.6 Implementează sortare dinamică (date, amount, vendor)
- [ ] 1.1.7 Testează cu query params multiple combinate

**Acceptare:**
```bash
curl "http://localhost:8000/api/v1/expenses?date_from=2025-01-01&date_to=2025-01-31&category_id=xxx&min_amount=100&max_amount=500&sort_by=date&order=desc&search=linella&skip=0&limit=20"
```

---

### TASK 1.2: Creare GET /api/v1/expenses/{id} (Detalii Expense)
**Fișier:** `app/api/expenses.py`
**Durată:** 1 oră

**Subtaskuri:**
- [ ] 1.2.1 Crează endpoint GET cu parametru `expense_id`
- [ ] 1.2.2 Query expense din DB cu filter owner_user_id
- [ ] 1.2.3 Decrypt `json_data` și `vendor`
- [ ] 1.2.4 Returnează ExpenseDetailResponse (cu json_data decrypted)
- [ ] 1.2.5 Testează endpoint

**Schema nouă necesară:** `ExpenseDetailResponse` (include json_data decrypted)

---

### TASK 1.3: Creare PUT /api/v1/expenses/{id} (Update Expense)
**Fișier:** `app/api/expenses.py`
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 1.3.1 Crează schema `ExpenseUpdateRequest` (amount, vendor, date, category_id, items, notes)
- [ ] 1.3.2 Crează endpoint PUT cu parametru `expense_id`
- [ ] 1.3.3 Validează ownership (user poate edita doar expense-ul său)
- [ ] 1.3.4 Update câmpuri în DB
- [ ] 1.3.5 Re-encrypt `json_data` și `vendor` după modificare
- [ ] 1.3.6 Testează update

**Acceptare:**
```bash
curl -X PUT "http://localhost:8000/api/v1/expenses/{id}" \
  -H "Content-Type: application/json" \
  -d '{"amount": 150.5, "vendor": "Updated Vendor", "category_id": "xxx"}'
```

---

### TASK 1.4: Creare DELETE /api/v1/expenses/{id} (Delete Expense)
**Fișier:** `app/api/expenses.py`
**Durată:** 1 oră

**Subtaskuri:**
- [ ] 1.4.1 Crează endpoint DELETE cu parametru `expense_id`
- [ ] 1.4.2 Validează ownership
- [ ] 1.4.3 Soft delete (add `deleted_at` column) SAU hard delete (db.delete)
- [ ] 1.4.4 Return SuccessResponse
- [ ] 1.4.5 Testează delete

**Decizie:** Soft delete sau hard delete? (Recomand soft delete pentru audit trail)

---

### TASK 1.5: Creare GET /api/v1/expenses/{id}/receipt (Receipt Image)
**Fișier:** `app/api/expenses.py`
**Durată:** 2-3 ore

**Subtaskuri:**
- [ ] 1.5.1 Adaugă câmp `receipt_file_path` în model Expense (migration)
- [ ] 1.5.2 Modifică POST /photo să salveze imaginea și path-ul în DB
- [ ] 1.5.3 Crează endpoint GET care returnează fișierul imagine (FileResponse)
- [ ] 1.5.4 Validează ownership
- [ ] 1.5.5 Testează download imagine

**Storage:** Decizi local filesystem sau S3?

---

### TASK 1.6: Creare API Statistics - GET /api/v1/statistics/summary
**Fișier:** `app/api/statistics.py` (NOU)
**Durată:** 3 ore

**Subtaskuri:**
- [ ] 1.6.1 Crează fișier nou `app/api/statistics.py`
- [ ] 1.6.2 Crează endpoint GET `/summary` cu query params: `period`, `date`
- [ ] 1.6.3 Calculează:
  - Total expenses current month
  - Total expenses current week
  - Total expenses today
  - Comparison cu luna anterioară (% change)
- [ ] 1.6.4 Crează schema `StatisticsSummaryResponse`
- [ ] 1.6.5 Testează endpoint

**Response Example:**
```json
{
  "current_month": {
    "total": 5420.50,
    "count": 85,
    "average": 63.77
  },
  "current_week": {
    "total": 1230.40,
    "count": 18
  },
  "today": {
    "total": 249.90,
    "count": 3
  },
  "comparison_previous_month": {
    "change_percentage": -12.5,
    "trend": "down"
  }
}
```

---

### TASK 1.7: Creare GET /api/v1/statistics/by_category
**Fișier:** `app/api/statistics.py`
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 1.7.1 Crează endpoint GET `/by_category` cu params: `period` (month/year), `date`
- [ ] 1.7.2 Group by category_id și SUM(amount)
- [ ] 1.7.3 Sortează desc by total
- [ ] 1.7.4 Include category name, color, icon (JOIN)
- [ ] 1.7.5 Testează endpoint

**Response Example:**
```json
{
  "period": "2025-01",
  "categories": [
    {
      "category_id": "xxx",
      "category_name": "Groceries",
      "color": "#4CAF50",
      "icon": "shopping-cart",
      "total": 2340.50,
      "count": 45,
      "percentage": 43.2
    },
    ...
  ]
}
```

---

### TASK 1.8: Creare GET /api/v1/statistics/by_vendor
**Fișier:** `app/api/statistics.py`
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 1.8.1 Crează endpoint GET `/by_vendor` cu params: `period`, `limit` (default 10)
- [ ] 1.8.2 Group by vendor și SUM(amount)
- [ ] 1.8.3 Sortează desc by total
- [ ] 1.8.4 Limit la top N vendors
- [ ] 1.8.5 Decrypt vendor names
- [ ] 1.8.6 Testează endpoint

**Response Example:**
```json
{
  "period": "2025-01",
  "top_vendors": [
    {
      "vendor": "Linella",
      "total": 1840.30,
      "count": 28,
      "percentage": 34.0
    },
    ...
  ]
}
```

---

### TASK 1.9: Creare GET /api/v1/statistics/trend
**Fișier:** `app/api/statistics.py`
**Durată:** 3 ore

**Subtaskuri:**
- [ ] 1.9.1 Crează endpoint GET `/trend` cu params: `type` (daily/weekly/monthly), `range`
- [ ] 1.9.2 Pentru `type=daily`: group by DATE(purchase_date) ultimele N zile
- [ ] 1.9.3 Pentru `type=weekly`: group by WEEK ultimele N săptămâni
- [ ] 1.9.4 Pentru `type=monthly`: group by MONTH ultimele N luni
- [ ] 1.9.5 SUM(amount) per perioada
- [ ] 1.9.6 Testează endpoint

**Response Example:**
```json
{
  "type": "daily",
  "range": 30,
  "data": [
    {"date": "2025-01-01", "total": 245.50, "count": 4},
    {"date": "2025-01-02", "total": 0, "count": 0},
    {"date": "2025-01-03", "total": 567.80, "count": 8},
    ...
  ]
}
```

---

### TASK 1.10: Creare GET /api/v1/statistics/comparison
**Fișier:** `app/api/statistics.py`
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 1.10.1 Crează endpoint cu params: `current_period`, `previous_period`
- [ ] 1.10.2 Calculează total pentru current_period
- [ ] 1.10.3 Calculează total pentru previous_period
- [ ] 1.10.4 Calculează % change
- [ ] 1.10.5 Testează endpoint

**Response Example:**
```json
{
  "current": {
    "period": "2025-01",
    "total": 5420.50,
    "count": 85
  },
  "previous": {
    "period": "2024-12",
    "total": 6200.00,
    "count": 92
  },
  "change": {
    "amount": -779.50,
    "percentage": -12.6,
    "trend": "down"
  }
}
```

---

### TASK 1.11: Creare GET /api/v1/expenses/export/csv
**Fișier:** `app/api/expenses.py`
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 1.11.1 Instalează dependență `csv` (built-in Python)
- [ ] 1.11.2 Crează endpoint GET `/export/csv` cu aceiași filters ca GET /expenses
- [ ] 1.11.3 Query expenses cu filters
- [ ] 1.11.4 Decrypt vendor
- [ ] 1.11.5 Generează CSV în memorie (StringIO)
- [ ] 1.11.6 Return StreamingResponse cu content-type text/csv
- [ ] 1.11.7 Testează download

**CSV Headers:**
```
Date,Vendor,Amount,Currency,Category,Source,Notes
```

---

### TASK 1.12: Creare GET /api/v1/expenses/export/pdf
**Fișier:** `app/api/expenses.py`
**Durată:** 4 ore

**Subtaskuri:**
- [ ] 1.12.1 Instalează `reportlab` sau `weasyprint`
- [ ] 1.12.2 Crează endpoint GET `/export/pdf`
- [ ] 1.12.3 Query expenses cu filters
- [ ] 1.12.4 Generează PDF cu logo, header, tabel
- [ ] 1.12.5 Include summary statistics
- [ ] 1.12.6 Return FileResponse
- [ ] 1.12.7 Testează download

**Dependență:**
```bash
pip install reportlab
```

---

### TASK 1.13: Register Statistics Router în main.py
**Fișier:** `app/main.py`
**Durată:** 15 min

**Subtaskuri:**
- [ ] 1.13.1 Import statistics router
- [ ] 1.13.2 Adaugă `app.include_router(statistics.router, prefix="/api/v1/statistics", tags=["statistics"])`
- [ ] 1.13.3 Verifică că endpoint-urile apar în /docs

---

### TASK 1.14: CORS Configuration pentru Frontend
**Fișier:** `app/main.py`
**Durată:** 30 min

**Subtaskuri:**
- [ ] 1.14.1 Verifică dacă CORS middleware este configurat
- [ ] 1.14.2 Adaugă `allow_origins=["http://localhost:3000"]` pentru Next.js
- [ ] 1.14.3 Testează că frontend poate face requests

---

## PARTEA 2: FRONTEND NEXT.JS (Prioritate ÎNALTĂ)

### TASK 2.1: Setup Proiect Next.js
**Durată:** 1-2 ore

**Subtaskuri:**
- [ ] 2.1.1 Creează proiect Next.js în folder separat `expense-web/`
  ```bash
  npx create-next-app@latest expense-web --typescript --tailwind --app --eslint
  ```
- [ ] 2.1.2 Instalează dependențe:
  ```bash
  npm install axios @tanstack/react-query zustand recharts
  npm install lucide-react date-fns
  npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog
  npm install react-hook-form zod @hookform/resolvers
  npm install sonner # toast notifications
  ```
- [ ] 2.1.3 Configurează `.env.local`:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```
- [ ] 2.1.4 Rulează `npm run dev` și verifică că merge pe localhost:3000

---

### TASK 2.2: Setup shadcn/ui Components
**Durată:** 1 oră

**Subtaskuri:**
- [ ] 2.2.1 Inițializează shadcn/ui:
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] 2.2.2 Instalează componente necesare:
  ```bash
  npx shadcn-ui@latest add button
  npx shadcn-ui@latest add card
  npx shadcn-ui@latest add table
  npx shadcn-ui@latest add dialog
  npx shadcn-ui@latest add dropdown-menu
  npx shadcn-ui@latest add input
  npx shadcn-ui@latest add label
  npx shadcn-ui@latest add select
  npx shadcn-ui@latest add tabs
  npx shadcn-ui@latest add badge
  npx shadcn-ui@latest add calendar
  ```
- [ ] 2.2.3 Verifică că componentele sunt în `components/ui/`

---

### TASK 2.3: Creare Axios Client & React Query Setup
**Fișier:** `lib/api/client.ts`
**Durată:** 1 oră

**Subtaskuri:**
- [ ] 2.3.1 Crează `lib/api/client.ts` cu axios instance:
  ```typescript
  import axios from 'axios';

  export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  ```
- [ ] 2.3.2 Crează `lib/providers/QueryProvider.tsx` cu QueryClientProvider
- [ ] 2.3.3 Wrap app în QueryProvider în `app/layout.tsx`

---

### TASK 2.4: Creare Type Definitions
**Fișier:** `types/expense.ts`, `types/category.ts`, `types/statistics.ts`
**Durată:** 1 oră

**Subtaskuri:**
- [ ] 2.4.1 Crează `types/expense.ts`:
  ```typescript
  export interface Expense {
    id: string;
    owner_user_id: string;
    source: 'photo' | 'voice' | 'manual';
    amount: number;
    currency: string;
    vendor: string;
    purchase_date: string;
    category_id?: string;
    ai_confidence?: number;
    created_at: string;
  }

  export interface ExpenseDetail extends Expense {
    json_data: {
      items?: Array<{name: string; qty: number; price: number}>;
      notes?: string;
      language?: string;
    };
  }
  ```
- [ ] 2.4.2 Crează `types/category.ts`
- [ ] 2.4.3 Crează `types/statistics.ts`

---

### TASK 2.5: Creare API Service Functions
**Fișiere:** `lib/api/expenses.ts`, `lib/api/categories.ts`, `lib/api/statistics.ts`
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 2.5.1 Crează `lib/api/expenses.ts` cu:
  ```typescript
  export const expensesApi = {
    getAll: (params: GetExpensesParams) => apiClient.get('/api/v1/expenses', { params }),
    getById: (id: string) => apiClient.get(`/api/v1/expenses/${id}`),
    update: (id: string, data: UpdateExpenseData) => apiClient.put(`/api/v1/expenses/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/v1/expenses/${id}`),
    createManual: (data: ManualExpenseData) => apiClient.post('/api/v1/expenses/manual', data),
    uploadPhoto: (file: File) => { /* FormData upload */ },
    exportCSV: (params: ExportParams) => apiClient.get('/api/v1/expenses/export/csv'),
  };
  ```
- [ ] 2.5.2 Crează `lib/api/categories.ts`
- [ ] 2.5.3 Crează `lib/api/statistics.ts`

---

### TASK 2.6: Creare Layout Principal cu Sidebar
**Fișier:** `app/(dashboard)/layout.tsx`
**Durată:** 3 ore

**Subtaskuri:**
- [ ] 2.6.1 Crează folder `app/(dashboard)/`
- [ ] 2.6.2 Crează `components/layout/Sidebar.tsx`:
  - Logo
  - Navigation links (Dashboard, Transactions, Statistics, Categories)
  - Dark mode toggle
  - User info (mock pentru acum)
- [ ] 2.6.3 Crează `components/layout/Header.tsx`:
  - Breadcrumbs
  - Search bar (opțional)
- [ ] 2.6.4 Crează layout responsive (sidebar collapsible pe mobile)

---

### TASK 2.7: Dashboard - Card-uri Sumare
**Fișier:** `app/(dashboard)/dashboard/page.tsx`
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 2.7.1 Crează `components/dashboard/SummaryCards.tsx`
- [ ] 2.7.2 Fetch data de la `/api/v1/statistics/summary` cu React Query
- [ ] 2.7.3 Afișează 4 card-uri:
  - Total luna curentă
  - Total săptămâna curentă
  - Total azi
  - Comparație cu luna anterioară (cu indicator ↑ / ↓)
- [ ] 2.7.4 Styling cu Tailwind + shadcn Card

---

### TASK 2.8: Dashboard - Grafic Trend (Line Chart)
**Fișier:** `components/dashboard/TrendChart.tsx`
**Durată:** 3 ore

**Subtaskuri:**
- [ ] 2.8.1 Instalează `recharts`
- [ ] 2.8.2 Crează componentă `TrendChart` cu Recharts LineChart
- [ ] 2.8.3 Fetch data de la `/api/v1/statistics/trend?type=daily&range=30`
- [ ] 2.8.4 Adaugă filtre: 7/30/90 zile (tabs)
- [ ] 2.8.5 Responsive design
- [ ] 2.8.6 Tooltip cu detalii

**Librărie:** Recharts LineChart

---

### TASK 2.9: Dashboard - Top Categorii (Pie Chart)
**Fișier:** `components/dashboard/CategoryPieChart.tsx`
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 2.9.1 Crează componentă cu Recharts PieChart
- [ ] 2.9.2 Fetch data de la `/api/v1/statistics/by_category`
- [ ] 2.9.3 Folosește culorile categoriilor din DB
- [ ] 2.9.4 Click pe slice → redirect la transactions cu filter

---

### TASK 2.10: Dashboard - Ultimele Tranzacții (Tabel)
**Fișier:** `components/dashboard/RecentTransactions.tsx`
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 2.10.1 Fetch ultimele 5 tranzacții: `/api/v1/expenses?limit=5&sort_by=date&order=desc`
- [ ] 2.10.2 Tabel cu: Data, Vendor, Sumă, Categorie
- [ ] 2.10.3 Link către detalii tranzacție
- [ ] 2.10.4 Styling cu shadcn Table

---

### TASK 2.11: Pagina Transactions - Tabel cu Toate Tranzacțiile
**Fișier:** `app/(dashboard)/transactions/page.tsx`
**Durată:** 4 ore

**Subtaskuri:**
- [ ] 2.11.1 Crează `components/transactions/TransactionsTable.tsx`
- [ ] 2.11.2 Fetch data cu paginare: `/api/v1/expenses?page=1&limit=50`
- [ ] 2.11.3 Coloane: Data, Vendor, Sumă, Categorie, Sursă, Acțiuni (Edit/Delete)
- [ ] 2.11.4 Implementează sortare client-side
- [ ] 2.11.5 Paginare (shadcn Pagination sau custom)
- [ ] 2.11.6 Loading state & error handling

**Librărie:** TanStack Table (opțional) sau shadcn Table

---

### TASK 2.12: Transactions - Filtrare Avansată
**Fișier:** `components/transactions/FilterBar.tsx`
**Durată:** 3 ore

**Subtaskuri:**
- [ ] 2.12.1 Crează componentă FilterBar
- [ ] 2.12.2 Input fields:
  - Date range picker (date_from, date_to)
  - Category multi-select
  - Amount range (min/max)
  - Source filter (photo/voice/manual)
  - Search vendor
- [ ] 2.12.3 Apply filters → update query params
- [ ] 2.12.4 Clear filters button
- [ ] 2.12.5 Sync cu URL query params

**Librărie:** react-day-picker pentru date range

---

### TASK 2.13: Transactions - Vizualizare Detalii (Modal)
**Fișier:** `components/transactions/TransactionDetailModal.tsx`
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 2.13.1 Crează componentă cu shadcn Dialog
- [ ] 2.13.2 Fetch detalii: `/api/v1/expenses/{id}`
- [ ] 2.13.3 Afișează toate câmpurile + json_data (items, notes)
- [ ] 2.13.4 Dacă source=photo, afișează receipt image
- [ ] 2.13.5 Buton Edit (deschide edit modal)
- [ ] 2.13.6 Buton Delete (cu confirmare)

---

### TASK 2.14: Transactions - Edit Modal
**Fișier:** `components/transactions/EditTransactionModal.tsx`
**Durată:** 3 ore

**Subtaskuri:**
- [ ] 2.14.1 Crează formular cu react-hook-form + zod
- [ ] 2.14.2 Câmpuri editabile: amount, vendor, date, category, items, notes
- [ ] 2.14.3 Pre-populare cu date existente
- [ ] 2.14.4 Validare client-side
- [ ] 2.14.5 Submit → PUT `/api/v1/expenses/{id}`
- [ ] 2.14.6 Toast notification (Sonner)
- [ ] 2.14.7 Invalidate React Query cache după update

---

### TASK 2.15: Transactions - Delete cu Confirmare
**Fișier:** `components/transactions/DeleteConfirmDialog.tsx`
**Durată:** 1 oră

**Subtaskuri:**
- [ ] 2.15.1 Crează dialog de confirmare (shadcn AlertDialog)
- [ ] 2.15.2 Buton Delete → DELETE `/api/v1/expenses/{id}`
- [ ] 2.15.3 Toast notification
- [ ] 2.15.4 Invalidate cache & refresh listă

---

### TASK 2.16: Pagina Statistics - Layout & Tab Navigation
**Fișier:** `app/(dashboard)/statistics/page.tsx`
**Durată:** 1 oră

**Subtaskuri:**
- [ ] 2.16.1 Crează layout cu tabs (shadcn Tabs):
  - Overview
  - By Category
  - By Vendor
  - Trends
- [ ] 2.16.2 Responsive design

---

### TASK 2.17: Statistics - Overview Tab
**Fișier:** `components/statistics/OverviewTab.tsx`
**Durată:** 3 ore

**Subtaskuri:**
- [ ] 2.17.1 Summary cards (reuse de la dashboard)
- [ ] 2.17.2 Grafic comparație lună curentă vs anterioară (Bar Chart)
- [ ] 2.17.3 Grafic trend săptămânal (Line Chart)
- [ ] 2.17.4 Fetch data de la `/statistics/comparison` și `/statistics/trend`

---

### TASK 2.18: Statistics - By Category Tab (Pie + Bar)
**Fișier:** `components/statistics/ByCategoryTab.tsx`
**Durată:** 3 ore

**Subtaskuri:**
- [ ] 2.18.1 Fetch data: `/statistics/by_category`
- [ ] 2.18.2 Pie chart cu distribuție
- [ ] 2.18.3 Bar chart cu top categorii
- [ ] 2.18.4 Tabel cu detalii (nume, total, procent)
- [ ] 2.18.5 Filtrare pe perioadă (luna curentă, ultimele 3/6/12 luni)

---

### TASK 2.19: Statistics - By Vendor Tab (Bar Chart)
**Fișier:** `components/statistics/ByVendorTab.tsx`
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 2.19.1 Fetch data: `/statistics/by_vendor?limit=10`
- [ ] 2.19.2 Bar chart orizontal cu top 10 vendors
- [ ] 2.19.3 Tabel cu detalii
- [ ] 2.19.4 Click pe vendor → redirect la transactions cu filter

---

### TASK 2.20: Statistics - Trends Tab (Line + Heatmap)
**Fișier:** `components/statistics/TrendsTab.tsx`
**Durată:** 4 ore

**Subtaskuri:**
- [ ] 2.20.1 Toggle între daily/weekly/monthly view
- [ ] 2.20.2 Line chart cu trend în timp
- [ ] 2.20.3 Heatmap cu distribuție pe ore (opțional, complex)
- [ ] 2.20.4 Statistici: sumă medie, max, min per perioadă

**Heatmap Note:** Dificil, poate fi skip pentru MVP

---

### TASK 2.21: Pagina Categories - CRUD
**Fișier:** `app/(dashboard)/categories/page.tsx`
**Durată:** 4 ore

**Subtaskuri:**
- [ ] 2.21.1 Fetch categories: `/api/v1/categories`
- [ ] 2.21.2 Grid/List view cu categorii (nume, culoare, icon, nr tranzacții)
- [ ] 2.21.3 Buton "Add Category" → modal
- [ ] 2.21.4 Create modal cu formular (nume, color picker, icon picker)
- [ ] 2.21.5 Edit button per categorie → edit modal
- [ ] 2.21.6 Delete button → confirmare + handle reassign

**Color Picker:** `react-colorful` sau simplu preset de culori

---

### TASK 2.22: Add Manual Expense - Form Modal
**Fișier:** `components/expenses/AddManualExpenseModal.tsx`
**Durată:** 3 ore

**Subtaskuri:**
- [ ] 2.22.1 Crează formular cu react-hook-form
- [ ] 2.22.2 Câmpuri: amount, vendor, category, date, notes, items (dynamic)
- [ ] 2.22.3 Validare cu zod
- [ ] 2.22.4 Submit → POST `/api/v1/expenses/manual`
- [ ] 2.22.5 Toast & invalidate cache
- [ ] 2.22.6 Buton "Add Expense" în header/sidebar

---

### TASK 2.23: Upload Receipt Photo - Drag & Drop
**Fișier:** `components/expenses/UploadReceiptModal.tsx`
**Durată:** 4 ore

**Subtaskuri:**
- [ ] 2.23.1 Crează modal cu drag & drop zone
- [ ] 2.23.2 Preview imagine înainte de upload
- [ ] 2.23.3 Upload → POST `/api/v1/expenses/photo` (FormData)
- [ ] 2.23.4 Progress bar pentru upload
- [ ] 2.23.5 Afișează parsed data (edit înainte de save)
- [ ] 2.23.6 Salvare finală

**Librărie:** react-dropzone (opțional)

---

### TASK 2.24: Export CSV Button
**Fișier:** `components/transactions/ExportButton.tsx`
**Durată:** 1 oră

**Subtaskuri:**
- [ ] 2.24.1 Buton "Export CSV" în transactions page
- [ ] 2.24.2 Trigger download: `/api/v1/expenses/export/csv` cu filters curente
- [ ] 2.24.3 Handle download cu axios blob response
- [ ] 2.24.4 Toast notification

---

### TASK 2.25: Export PDF Button
**Fișier:** `components/transactions/ExportButton.tsx`
**Durată:** 1 oră

**Subtaskuri:**
- [ ] 2.25.1 Buton "Export PDF"
- [ ] 2.25.2 Trigger download: `/api/v1/expenses/export/pdf`
- [ ] 2.25.3 Handle download
- [ ] 2.25.4 Toast notification

---

### TASK 2.26: Dark Mode Toggle
**Fișier:** `components/layout/ThemeToggle.tsx`
**Durată:** 1 oră

**Subtaskuri:**
- [ ] 2.26.1 Instalează `next-themes`
- [ ] 2.26.2 Setup ThemeProvider
- [ ] 2.26.3 Crează toggle button în sidebar
- [ ] 2.26.4 Persist preference în localStorage

---

### TASK 2.27: Responsive Design - Mobile Testing
**Durată:** 3 ore

**Subtaskuri:**
- [ ] 2.27.1 Test toate paginile pe mobile (375px, 768px)
- [ ] 2.27.2 Sidebar collapsible pe mobile (hamburger menu)
- [ ] 2.27.3 Tabele → scroll horizontal sau card view pe mobile
- [ ] 2.27.4 Grafice responsive (Recharts responsiveContainer)
- [ ] 2.27.5 Forms → full width pe mobile

---

### TASK 2.28: Error Handling & Loading States
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 2.28.1 Crează `components/common/LoadingSpinner.tsx`
- [ ] 2.28.2 Crează `components/common/ErrorMessage.tsx`
- [ ] 2.28.3 Adaugă loading states în toate componentele cu fetch
- [ ] 2.28.4 Handle erori API (toast notifications)
- [ ] 2.28.5 React Query error boundaries

---

### TASK 2.29: Testing End-to-End
**Durată:** 4 ore

**Subtaskuri:**
- [ ] 2.29.1 Test complete flow:
  - View dashboard
  - Filter transactions
  - View transaction details
  - Edit transaction
  - Delete transaction
  - Add manual expense
  - Upload photo receipt
  - View statistics
  - Manage categories
  - Export CSV/PDF
- [ ] 2.29.2 Fix bugs găsite în testing

---

## PARTEA 3: DEPLOYMENT & POLISH

### TASK 3.1: Backend Deployment Verification
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 3.1.1 Verifică Docker build merge cu noi endpoints
- [ ] 3.1.2 Test toate endpoints în Postman/Thunder Client
- [ ] 3.1.3 Update documentație API (swagger /docs)

---

### TASK 3.2: Frontend Build & Deploy
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 3.2.1 Build Next.js: `npm run build`
- [ ] 3.2.2 Test production build local: `npm run start`
- [ ] 3.2.3 Deploy pe Vercel:
  ```bash
  npm install -g vercel
  vercel --prod
  ```
- [ ] 3.2.4 Setup environment variables în Vercel
- [ ] 3.2.5 Test live deployment

---

### TASK 3.3: Final Polish
**Durată:** 2 ore

**Subtaskuri:**
- [ ] 3.3.1 Code cleanup & remove console.logs
- [ ] 3.3.2 Fix TypeScript warnings
- [ ] 3.3.3 Optimize images
- [ ] 3.3.4 Add meta tags (SEO)
- [ ] 3.3.5 Update README cu instrucțiuni

---

## REZUMAT TOTAL

| Partea | Tasks | Durată Estimată |
|--------|-------|-----------------|
| Backend API | 14 tasks | 28-35 ore |
| Frontend Next.js | 29 tasks | 60-75 ore |
| Deployment & Polish | 3 tasks | 6-8 ore |
| **TOTAL** | **46 tasks** | **94-118 ore** |

**Dacă lucrezi full-time (8h/zi):** 12-15 zile lucrătoare (2.5-3 săptămâni)
**Dacă lucrezi part-time (4h/zi):** 24-30 zile lucrătoare (5-6 săptămâni)

---

## ORDINEA DE EXECUȚIE RECOMANDATĂ

### SĂPTĂMÂNA 1: Backend API (35 ore)
1. Tasks 1.1 - 1.5: CRUD Expenses complet
2. Tasks 1.6 - 1.10: Statistics endpoints
3. Tasks 1.11 - 1.14: Export & CORS

### SĂPTĂMÂNA 2: Frontend Setup & Dashboard (40 ore)
4. Tasks 2.1 - 2.6: Setup proiect + layout
5. Tasks 2.7 - 2.10: Dashboard complet

### SĂPTĂMÂNA 3: Transactions & Statistics (40 ore)
6. Tasks 2.11 - 2.15: Transactions page complet
7. Tasks 2.16 - 2.20: Statistics page complet

### SĂPTĂMÂNA 4: Categories, Upload & Polish (35 ore)
8. Tasks 2.21 - 2.23: Categories + Upload
9. Tasks 2.24 - 2.29: Export, theme, responsive, testing
10. Tasks 3.1 - 3.3: Deployment

---

## CHECKLIST ÎNAINTE DE START

- [ ] Backend rulează în Docker
- [ ] Database este populată cu date de test
- [ ] Ai un API key valid pentru Groq (pentru testing upload)
- [ ] Node.js instalat (v18+)
- [ ] Git repository setup pentru frontend

---

## MONITORIZARE PROGRES

Voi folosi **TodoWrite tool** pentru tracking în timp real.

**Gata de start?** 🚀

Ce vrei să faci acum:
1. Încep cu Task 1.1 (Backend: Filtrare expenses)?
2. Sau vrei să creăm mai întâi Next.js project (Task 2.1)?
3. Sau altceva?
