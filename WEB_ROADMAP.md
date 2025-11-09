# Roadmap - Versiune Web pentru Expense Bot AI

## Prezentare Generală

Versiunea web va oferi o interfață vizuală completă pentru gestionarea cheltuielilor, cu funcționalități avansate de analiză, editare și raportare.

---

## FASE DE DEZVOLTARE

### FAZA 1: Setup & Autentificare (Prioritate: CRITICĂ)
**Durată estimată: 3-5 zile**

#### 1.1 Setup Proiect Frontend
- [ ] Creare proiect Next.js 14 (App Router) cu TypeScript
- [ ] Setup Tailwind CSS pentru styling
- [ ] Configurare ESLint și Prettier
- [ ] Setup variabile de mediu (.env.local)
- [ ] Configurare axios/fetch pentru API calls

**Tehnologii:**
```bash
npx create-next-app@latest expense-web --typescript --tailwind --app
npm install axios react-query @tanstack/react-query zustand
```

#### 1.2 Sistem de Autentificare
- [ ] Pagină de login cu JWT
- [ ] Integrare cu backend FastAPI (endpoint `/auth/login`)
- [ ] Storage pentru JWT token (localStorage sau cookies)
- [ ] Protected routes (middleware Next.js)
- [ ] Logout funcționalitate
- [ ] Auto-refresh token

**Endpoints necesare (Backend):**
```python
POST /api/v1/auth/login          # Username/password → JWT
POST /api/v1/auth/refresh        # Refresh token
POST /api/v1/auth/telegram_bind  # Link Telegram ID
GET  /api/v1/auth/me             # Get current user info
```

---

### FAZA 2: Dashboard Principal (Prioritate: ÎNALTĂ)
**Durată estimată: 5-7 zile**

#### 2.1 Layout & Navigație
- [ ] Sidebar cu navigare (Dashboard, Tranzacții, Categorii, Statistici, Setări)
- [ ] Header cu user info și logout
- [ ] Responsive design (mobile-first)
- [ ] Dark mode toggle

#### 2.2 Dashboard Overview
- [ ] **Card-uri sumare:**
  - Total cheltuieli luna curentă
  - Total cheltuieli săptămâna curentă
  - Total cheltuieli azi
  - Comparație cu luna anterioară (+ sau - %)

- [ ] **Grafic principal: Cheltuieli pe zile (ultimele 30 zile)**
  - Librărie: Chart.js sau Recharts
  - Tip: Line chart sau Bar chart
  - Filtrare: ultimele 7/30/90 zile

- [ ] **Top 5 Categorii (Current Month)**
  - Pie chart sau Donut chart
  - Click pe categorie → filtrare tranzacții

- [ ] **Ultimele 5 Tranzacții**
  - Tabel cu: dată, vendor, sumă, categorie
  - Link rapid către detalii tranzacție

**Librării pentru grafice:**
```bash
npm install recharts
# SAU
npm install chart.js react-chartjs-2
```

---

### FAZA 3: Gestionare Tranzacții (Prioritate: ÎNALTĂ)
**Durată estimată: 6-8 zile**

#### 3.1 Lista de Tranzacții (View All)
- [ ] **Tabel cu toate tranzacțiile:**
  - Coloane: Data, Vendor, Sumă, Categorie, Sursă (photo/voice/manual), Acțiuni
  - Sortare: după dată (desc/asc), sumă, categorie
  - Paginare: 20/50/100 items per page
  - Search: căutare după vendor, sumă, categorie

- [ ] **Filtrare avansată:**
  - Interval de date (date picker)
  - Categorie (dropdown multi-select)
  - Sumă min/max (range slider)
  - Sursă (photo/voice/manual)
  - Export rezultate filtrate (CSV)

**Endpoints necesare:**
```python
GET /api/v1/expenses?page=1&limit=50&sort=date&order=desc&category=Food&date_from=2025-01-01&date_to=2025-01-31
```

#### 3.2 Vizualizare Detalii Tranzacție
- [ ] Modal/Page pentru detalii complete:
  - Toate câmpurile (amount, currency, vendor, date, category)
  - Items list (dacă există)
  - Note
  - AI confidence score
  - Source type (photo/voice/manual)
  - Timestamp creare
  - **Dacă source = photo:** afișare imagine bonului fiscal
  - **Dacă source = voice:** player audio (dacă păstrezi fișierul)

**Endpoints necesare:**
```python
GET /api/v1/expenses/{expense_id}  # Get full details
GET /api/v1/expenses/{expense_id}/receipt  # Get receipt image
```

#### 3.3 Editare Tranzacție
- [ ] Formular de editare:
  - Modificare sumă
  - Modificare vendor
  - Modificare categorie
  - Modificare dată
  - Modificare items (add/remove/edit)
  - Modificare note

- [ ] Validare client-side
- [ ] Confirmare înainte de salvare
- [ ] Toast notification la succes/eroare

**Endpoints necesare:**
```python
PUT /api/v1/expenses/{expense_id}
```

#### 3.4 Ștergere Tranzacție
- [ ] Buton de delete cu confirmare (modal)
- [ ] Soft delete sau hard delete (decizi tu)
- [ ] Toast notification
- [ ] Refresh listă după ștergere

**Endpoints necesare:**
```python
DELETE /api/v1/expenses/{expense_id}
```

---

### FAZA 4: Statistici Avansate (Prioritate: MEDIE)
**Durată estimată: 5-7 zile**

#### 4.1 Pagina de Statistici

**Grafice disponibile:**

1. **Cheltuieli pe Categorii (Pie/Donut Chart)**
   - Filtrare: luna curentă, ultimele 3/6/12 luni
   - Interactiv: click pe categorie → detalii

2. **Trend Cheltuieli în Timp (Line Chart)**
   - Pe zile (ultimele 30 zile)
   - Pe săptămâni (ultimele 12 săptămâni)
   - Pe luni (ultimul an)
   - Posibilitate de comparare cu perioada anterioară

3. **Top Vendori (Bar Chart)**
   - Top 10 vendori cu cele mai multe cheltuieli
   - Filtrare pe perioada

4. **Distribuție pe Ore (Heatmap/Bar Chart)**
   - La ce oră faci cele mai multe cheltuieli
   - Util pentru înțelegerea obiceiurilor

5. **Sumă Medie pe Tranzacție**
   - Per categorie
   - Evoluție în timp

6. **Statistici Comparative**
   - Luna asta vs luna trecută
   - Săptămâna asta vs săptămâna trecută
   - An curent vs an trecut

**Endpoints necesare:**
```python
GET /api/v1/statistics/summary?period=month&date=2025-01
GET /api/v1/statistics/by_category?period=month
GET /api/v1/statistics/by_vendor?limit=10
GET /api/v1/statistics/trend?type=daily&range=30
GET /api/v1/statistics/comparison?current=2025-01&previous=2024-12
```

#### 4.2 Rapoarte
- [ ] Export PDF cu statistici
- [ ] Export CSV cu toate datele
- [ ] Raport săptămânal/lunar (email automat - opțional)

---

### FAZA 5: Gestionare Categorii (Prioritate: MEDIE)
**Durată estimată: 3-4 zile**

#### 5.1 Lista Categorii
- [ ] Grid/List view cu toate categoriile
- [ ] Afișare: nume, culoare, icon, număr tranzacții

#### 5.2 CRUD Categorii
- [ ] Creare categorie nouă (nume, culoare picker, icon picker)
- [ ] Editare categorie existentă
- [ ] Ștergere categorie (cu warning dacă are tranzacții)
- [ ] Reassign tranzacții la altă categorie când ștergi

**Endpoints necesare:**
```python
GET    /api/v1/categories
POST   /api/v1/categories
PUT    /api/v1/categories/{id}
DELETE /api/v1/categories/{id}
POST   /api/v1/categories/{id}/reassign  # Reassign expenses
```

---

### FAZA 6: Adăugare Cheltuieli Manual (Prioritate: MEDIE)
**Durată estimată: 3-4 zile**

#### 6.1 Formular Manual
- [ ] Formular pentru adăugare cheltuială:
  - Sumă (required)
  - Vendor (required)
  - Categorie (dropdown)
  - Dată (date picker, default: azi)
  - Note (optional)
  - Items (optional, dynamic add/remove)

- [ ] Validare client-side
- [ ] Submit → salvare în DB

**Endpoints necesare:**
```python
POST /api/v1/expenses/manual
```

---

### FAZA 7: Upload Bonuri Fiscale (Prioritate: MEDIE)
**Durată estimată: 4-5 zile**

#### 7.1 Upload Interface
- [ ] Drag & drop zone pentru imagini
- [ ] Preview imagine înainte de upload
- [ ] Progress bar pentru upload
- [ ] Procesare cu Groq Vision API
- [ ] Afișare rezultat parsed (edit înainte de save)
- [ ] Salvare în DB

**Endpoints necesare:**
```python
POST /api/v1/expenses/photo  # Upload + parse + save
```

---

### FAZA 8: Setări Utilizator (Prioritate: SCĂZUTĂ)
**Durată estimată: 2-3 zile**

#### 8.1 Pagina Setări
- [ ] **Profil:**
  - Schimbare nume
  - Schimbare parolă
  - Telegram ID linked (afișare)

- [ ] **Preferințe:**
  - Monedă default (MDL, EUR, USD, etc.)
  - Limba (RO, EN)
  - Dark/Light mode preference
  - Notificări (opțional)

- [ ] **Export Date:**
  - Export toate datele (JSON/CSV)
  - Delete account (cu confirmare)

**Endpoints necesare:**
```python
PUT /api/v1/users/me
PUT /api/v1/users/me/password
GET /api/v1/users/me/export
DELETE /api/v1/users/me
```

---

## FUNCȚIONALITĂȚI BONUS (Post-MVP)

### B1. Buget & Alerte
- [ ] Setare buget lunar per categorie
- [ ] Progress bar pentru buget
- [ ] Alertă când depășești 80% din buget
- [ ] Notificări push (opțional)

### B2. Recurring Expenses (Abonamente)
- [ ] Marchează cheltuieli recurente (Netflix, Spotify, etc.)
- [ ] Predicție cheltuieli viitoare
- [ ] Reminder pentru plăți recurente

### B3. Multi-Currency Support
- [ ] Conversie automată (API pentru exchange rates)
- [ ] Afișare în moneda preferată
- [ ] Istoric exchange rates

### B4. Partajare în Grup
- [ ] Shared expenses (cu altă persoană)
- [ ] Split bills
- [ ] Who owes whom?

### B5. Tags & Notes
- [ ] Adăugare tag-uri custom (#vacation, #work, etc.)
- [ ] Filtrare după tag-uri
- [ ] Note extinse pentru tranzacții

### B6. Google Sheets Integration
- [ ] Sync automat cu Google Sheets
- [ ] Export periodic (zilnic/săptămânal)

### B7. Mobile App (React Native/Flutter)
- [ ] Aplicație mobilă nativă
- [ ] Scan bonuri cu camera
- [ ] Notificări push
- [ ] Offline mode

---

## STACK TEHNOLOGIC RECOMANDAT

### Frontend
```
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + shadcn/ui components
- State Management: Zustand sau Jotai
- Data Fetching: TanStack Query (React Query)
- Charts: Recharts sau Chart.js
- Forms: React Hook Form + Zod validation
- Date Picker: react-day-picker
- Tables: TanStack Table
- Icons: Lucide React
- Notifications: Sonner sau React Hot Toast
```

### Backend (deja ai)
```
- Framework: FastAPI (Python)
- Database: PostgreSQL
- ORM: SQLAlchemy + Alembic
- AI: Groq API
- Auth: JWT
```

### DevOps
```
- Frontend Hosting: Vercel (recomandat pentru Next.js)
- Backend Hosting: Docker + VPS
- Database: PostgreSQL (managed sau self-hosted)
- CDN: Cloudflare (pentru imagini bonuri)
```

---

## PRIORITIZARE DEZVOLTARE

### Sprint 1 (2 săptămâni): FUNCȚIONALITĂȚI ESENȚIALE
1. Setup proiect + Autentificare
2. Dashboard principal cu grafice de bază
3. Lista tranzacții (view all)
4. Vizualizare detalii tranzacție

### Sprint 2 (2 săptămâni): CRUD COMPLET
5. Editare tranzacție
6. Ștergere tranzacție
7. Gestionare categorii
8. Adăugare cheltuială manual

### Sprint 3 (2 săptămâni): STATISTICI & UPLOAD
9. Pagina statistici avansate
10. Upload bonuri fiscale
11. Export CSV/PDF
12. Filtrare avansată

### Sprint 4 (1 săptămână): POLISH & DEPLOYMENT
13. Setări utilizator
14. Responsive design final
15. Testing end-to-end
16. Deployment producție

---

## STRUCTURA PROIECTULUI FRONTEND

```
expense-web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Dashboard principal
│   │   ├── transactions/
│   │   │   ├── page.tsx           # Lista tranzacții
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Detalii tranzacție
│   │   ├── statistics/
│   │   │   └── page.tsx           # Statistici avansate
│   │   ├── categories/
│   │   │   └── page.tsx           # Gestionare categorii
│   │   ├── settings/
│   │   │   └── page.tsx           # Setări utilizator
│   │   └── layout.tsx             # Layout cu sidebar
│   ├── api/                       # API routes (proxy către backend)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── PieChart.tsx
│   │   └── BarChart.tsx
│   ├── transactions/
│   │   ├── TransactionTable.tsx
│   │   ├── TransactionModal.tsx
│   │   └── TransactionForm.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Navigation.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts              # Axios instance
│   │   ├── expenses.ts            # Expense API calls
│   │   ├── categories.ts
│   │   └── auth.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useExpenses.ts
│   │   └── useCategories.ts
│   ├── store/
│   │   └── authStore.ts           # Zustand store
│   └── utils/
│       ├── formatters.ts          # Date, currency formatters
│       └── validators.ts          # Zod schemas
├── types/
│   ├── expense.ts
│   ├── category.ts
│   └── user.ts
├── public/
├── .env.local
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## ENDPOINTS BACKEND NECESARE (Completare)

Aici este lista completă de endpoints pe care trebuie să le implementezi în backend:

### Authentication
```python
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/telegram_bind
GET    /api/v1/auth/me
POST   /api/v1/auth/logout
```

### Expenses
```python
GET    /api/v1/expenses                # List with filters, pagination
GET    /api/v1/expenses/{id}           # Get single expense
POST   /api/v1/expenses/manual         # Create manual expense
POST   /api/v1/expenses/photo          # Upload photo receipt
POST   /api/v1/expenses/voice          # Upload voice message
PUT    /api/v1/expenses/{id}           # Update expense
DELETE /api/v1/expenses/{id}           # Delete expense
GET    /api/v1/expenses/{id}/receipt   # Get receipt image
```

### Categories
```python
GET    /api/v1/categories              # List all user categories
POST   /api/v1/categories              # Create category
PUT    /api/v1/categories/{id}         # Update category
DELETE /api/v1/categories/{id}         # Delete category
POST   /api/v1/categories/{id}/reassign # Reassign expenses
```

### Statistics
```python
GET    /api/v1/statistics/summary
GET    /api/v1/statistics/by_category
GET    /api/v1/statistics/by_vendor
GET    /api/v1/statistics/trend
GET    /api/v1/statistics/comparison
```

### Users
```python
GET    /api/v1/users/me
PUT    /api/v1/users/me
PUT    /api/v1/users/me/password
GET    /api/v1/users/me/export
DELETE /api/v1/users/me
```

---

## ESTIMARE TIMP TOTAL

| Fază | Descriere | Durată |
|------|-----------|--------|
| Faza 1 | Setup & Autentificare | 3-5 zile |
| Faza 2 | Dashboard Principal | 5-7 zile |
| Faza 3 | Gestionare Tranzacții | 6-8 zile |
| Faza 4 | Statistici Avansate | 5-7 zile |
| Faza 5 | Gestionare Categorii | 3-4 zile |
| Faza 6 | Adăugare Manual | 3-4 zile |
| Faza 7 | Upload Bonuri | 4-5 zile |
| Faza 8 | Setări | 2-3 zile |
| **TOTAL MVP** | | **31-43 zile** |

**Dacă lucrezi full-time:** 6-9 săptămâni (1.5-2 luni)
**Dacă lucrezi part-time (4h/zi):** 12-18 săptămâni (3-4 luni)

---

## NEXT STEPS - CE FACI ACUM?

1. **Hotărăște stack-ul:**
   - Next.js sau alt framework?
   - Tailwind CSS sau alt styling?
   - Recharts sau Chart.js?

2. **Creează proiectul:**
   ```bash
   npx create-next-app@latest expense-web --typescript --tailwind --app
   cd expense-web
   ```

3. **Implementează Faza 1:**
   - Setup autentificare
   - Protected routes
   - Layout principal

4. **Backend API:**
   - Implementează endpoints lipsă
   - Testează cu Postman/Thunder Client

5. **Deploy:**
   - Frontend: Vercel
   - Backend: Docker VPS (deja ai)

---

**Ai nevoie de ajutor pentru:**
- Setup inițial al proiectului Next.js?
- Implementarea unui endpoint specific?
- Crearea unui component (ex: grafic, tabel)?
- Structura bazei de date pentru noi features?

Spune-mi ce vrei să începem mai întâi! 🚀
