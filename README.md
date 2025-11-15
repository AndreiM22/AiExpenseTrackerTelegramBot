# Expense Bot AI (Next.js Edition)

Panoul Expense Bot AI rulează acum exclusiv pe **Next.js 16 (App Router)** cu API routes în TypeScript. Toate funcționalitățile de dashboard, management de categorii și generarea AI a cheltuielilor manuale rulează local în același proces – fără FastAPI, fără Docker.

## Ce este inclus
- **UI & API unificate** în `apps/web` (Next.js + Tailwind + TypeScript)
- **Prisma + SQLite data store** (`src/server/mock-db.ts` + `prisma/schema.prisma`) care gestionează categorii, cheltuieli și statistici (seed demo + CRUD real)
- **Autentificare NextAuth** cu provider Credentials și middleware care protejează UI + API
- **Teste automatizate** cu Vitest pentru logica critică din store
- **Design React 19 / Tailwind 4** cu componente moderne (dashboard, tables, charts, dialogs)

## Setup rapid
1. Clonează repo-ul și intră în director:
   ```bash
   git clone <repo>
   cd TelegramBotAI
   ```
2. Copiază `.env.example` din `apps/web` în propriul `.env` (Next.js citește fișierul din același director):
   ```bash
   cp apps/web/.env.example apps/web/.env
   # setează NEXTAUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD etc.
   ```
3. Instalează dependențele și rulează în modul development:
   ```bash
   npm install --prefix apps/web
   npm run dev            # rulează Next.js pe http://localhost:3000
   ```

> Poți folosi și scripturile din rădăcină (`npm run dev`, `npm run lint`, `npm run test`, `npm run build`) – toate proxiază spre `apps/web`.

## Variabile de mediu esențiale
| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | URL-ul public al aplicației (ex. `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` / `API_BASE_URL` | Baza pentru fetch-uri către API-ul Next (setată pe domeniu, ex. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Secret folosit de NextAuth pentru JWT-uri |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credențialele de login (folosite de providerul Credentials) |
| `GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`, etc. | Placeholder-e pentru integrarea viitoare cu servicii reale |

> Notă: `NEXT_PUBLIC_API_URL` și `API_BASE_URL` trebuie să indice domeniul (fără `/api`). Rutele vor adăuga automat prefixul `/api/...`.

## Autentificare
- Ruta `/login` afișează formularul NextAuth (Credentials provider)
- Middleware-ul NextAuth protejează toate rutele (UI + `/api/v1/*`) cu excepția `login` și `api/auth`
- Utilizatorul logat este afișat în `HeaderBar`, iar `SignOutButton` (NextAuth) finalizează sesiunea

## API Routes disponibile
Toate rutele sunt disponibile local (mock data) și replicate în UI:
- `GET/POST /api/v1/categories` + `PUT/DELETE /api/v1/categories/:id` + `POST /api/v1/categories/suggest`
- `GET /api/v1/expenses`, `GET/PUT/DELETE /api/v1/expenses/:id`
- `POST /api/v1/expenses/manual/preview`, `POST /api/v1/expenses/manual/confirm`
- `GET /api/v1/statistics/summary`, `/by_category`, `/by_vendor`, `/trend`

Aceste rute folosesc helper-ele din `src/server/mock-db.ts`, ceea ce face simplă înlocuirea lor cu un DB real (Prisma/Postgres, Supabase etc.) atunci când ești gata.

## Scripturi utile
| Command | Ce face |
| --- | --- |
| `npm run dev` | Rulează Next.js în modul development |
| `npm run lint` | Rulează ESLint pe `apps/web` |
| `npm run test` | Rulează Vitest (testele din `src/server/*.test.ts`) |
| `npm run build` | Build de producție + verifică proxy/api |
| `npm run start` | Rulează build-ul (după `npm run build`) |
| `npm run format` | Rulează Prettier pe cod |

> **Prisma + SQLite**: primul request către API declanșează `ensureSeedData`, care creează automat tabelele și un set de date demo în `apps/web/prisma/dev.db`. Pentru un reset rapid rulează `npm run test` sau importă helperul `resetMockData()` într-un script.

### Groq AI (manual text)
1. Setează `GROQ_API_KEY` și (opțional) `GROQ_MANUAL_MODEL` în `.env`.
2. `POST /api/v1/expenses/manual/preview` trimite textul spre Groq și primește JSON structurat (vendor, amount, items). Dacă cheia lipsește, sistemul folosește heuristica locală.
3. `confirmManualExpense` salvează rezultatul în DB; Telegram reusează aceleași fluxuri pentru mesajele text.

### Telegram webhook
- Setează `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` și `ENABLE_TELEGRAM_BOT=true`.
- Configurează webhook-ul la `https://<domeniu>/api/telegram/webhook` și transmite `secret_token` identic cu `TELEGRAM_WEBHOOK_SECRET`.
- Botul răspunde cu un rezumat după fiecare mesaj text și salvează cheltuiala.

## Testare
Vitest este configurat cu alias pentru `server-only` și folosește același SQLite dev DB (resetat înaintea fiecărui test). Rularea testelor:
```bash
npm run test
```
Output-ul include un raport de coverage text + lcov (util pentru integrări CI).

## Structură actuală
```
TelegramBotAI/
├── apps/
│   └── web/
│       ├── package.json (scripts Next.js)
│       ├── next.config.ts, tsconfig.json, vitest.config.ts
│       ├── src/
│       │   ├── app/ (App Router: dashboard, login, API routes)
│       │   ├── components/ (layout, dashboard, auth)
│       │   ├── lib/ (fetch helpers, types)
│       │   ├── server/ (Prisma services, Groq client, Telegram)
│       │   └── proxy.ts, auth.ts etc.
├── .env.example
├── package.json (script proxy către apps/web)
├── vercel.json (pipeline & build commands)
├── docker-compose.prod.yml
├── Dockerfile
└── TASKS_CLEANUP.md (roadmap curent)
```

## Deploy pe Vercel
1. `vercel link` pentru a conecta proiectul.
2. Adaugă variabilele de mediu (`vercel env add NEXTAUTH_SECRET`, `GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN` etc.).
3. Rulează `vercel --prod`. Configul din `vercel.json` rulează `npm run build`, iar `postinstall` din rădăcină instalează dependențele și în `apps/web`. `proxy.ts` înlocuiește middleware-ul clasic conform cerințelor Turbopack.

> Pentru Render/Fly rulează aceleași comenzi: `npm install`, `npm install --prefix apps/web`, `npm run build`, `npm run start`.

## Deploy pe Docker (server propriu)
1. Copiază `apps/web/.env.production.example` în `apps/web/.env.production` și setează valorile (folosește domeniul real și setează `DATABASE_URL="file:/data/prisma/dev.db"` pentru persistență în container).
2. Pe server:
   ```bash
   git clone <repo> /opt/expensebot
   cd /opt/expensebot
   docker compose -f docker-compose.prod.yml up -d
   ```
   Volumul `expensebot_data` păstrează baza SQLite în `/data/prisma/dev.db`.
3. Actualizare manuală:
   ```bash
   git pull
   docker compose -f docker-compose.prod.yml up -d --build
   ```

## CI/CD (GitHub Actions + GHCR)
- Workflow-ul `.github/workflows/deploy.yml` construiește imaginea Docker și o publică în GHCR pe fiecare push în `main`.
- Dacă adaugi în repository secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY`, același workflow se conectează prin SSH la server (`/opt/expensebot`) și rulează `docker compose` pentru a trage și porni noua versiune (`IMAGE_NAME=$IMAGE_NAME docker compose ...`).
- În `docker-compose.prod.yml`, serviciul `web` folosește imaginea generată (`ghcr.io/<org>/<repo>:latest`) sau reconstruiește local dacă rulezi manual.

## Roadmap următor
- Adaugă NextAuth Providers suplimentare (OAuth, magic link etc.)
- Extinde Groq AI pentru upload foto/audio și interacțiuni Telegram avansate
- Automatizează pipeline-ul de deploy/monitorizare

Pentru status curent și checklist detaliat folosește `TASKS_CLEANUP.md` – acolo bifăm fiecare etapă importantă.
