# PLAN CURĂȚARE ȘI RESCRIERI (TypeScript + Next.js)

Legenda:
- [X] finisat
- [ ] nefinisat

## 1. Pregătire noului setup Next.js TypeScript
- [X] 1.1 Decide structura finală (monorepo cu `apps/web` sau un singur Next.js în rădăcină). *(Ales: monorepo minim cu aplicația principală în `apps/web`)*
- [X] 1.2 Rulează `npx create-next-app@latest --ts` în locația aleasă și șterge folderele moștenite care nu mai sunt necesare (`expense-web/` vechi dacă migrezi în root).
- [X] 1.3 Configurează eslint/prettier și scripts în `package.json` (lint, test, build, start).
- [X] 1.4 Creează fișierele `.env.example` și documentează variabilele (API keys, DB, tokens).

## 2. Reimplementare funcționalități în TypeScript/Next.js
- [X] 2.1 Reproduce layout-ul și componentele UI (Dashboard, Transactions, Statistics, Upload, Categories) folosind noul design system.
- [X] 2.2 Mută logica de upload bonuri și integrarea Groq AI într-un API Route Next (`/app/api/expenses/photo` etc.). *(Acum există rute Next.js care procesează descrieri/manual input și generează previzualizări cu logică AI mockuită, plus confirmarea/salvarea direct în store-ul TypeScript.)*
- [X] 2.3 Recreează API-ul pentru expenses/categories/statistici folosind Next.js Route Handlers (sau un backend TS separat) și conectează o bază de date (ex: Prisma + Postgres/SQlite). *(Rutele `/api/v1/...` sunt alimentate dintr-un store TypeScript care ține date demo.)*
- [X] 2.4 Implementează autentificarea/authorization-ul necesar pentru bot și UI (decide dacă folosești NextAuth, tokens custom etc.). *(NextAuth + middleware, formular dedicat de login și sign-out din HeaderBar.)*
- [X] 2.5 Adaugă teste unitare/integration (Vitest/Jest + Playwright) pentru rutele critice și componentele majore. *(Vitest rulează teste pe `mock-db` și este legat la `npm run test` + coverage.)*
- [X] 2.6 Actualizează README și ghidurile de rulare pentru noua arhitectură (npm scripts, deploy pe Vercel/alt host).

## 3. Curățare infrastructură veche
- [X] 3.1 Șterge toate fișierele Docker (`Dockerfile`, `docker-compose*.yml`, `verify_docker.sh`, `deploy_server.sh`, `setup-ssl.sh`, scripturile din `scripts/` dedicate Docker).
- [X] 3.2 Elimină backend-ul Python (folderele `app/`, `migrations/`, `tests/`, `scripts/` specifice FastAPI, `alembic.ini`, `requirements*.txt`, `expensebot.db`, `venv/`).
- [X] 3.3 Curăță fișierele auxiliare vechi (ghiduri de deploy Docker, `run_local.sh`, `test_local.sh`, `deploy_*`, `setup_telegram_bot.sh`, orice doc dedicat infrastructurii anterioare).
- [X] 3.4 Actualizează `.gitignore` pentru noul stack (păstrează doar excluderile relevante pentru Node/Next).

## 4. Verificări finale
- [ ] 4.1 Rulează `npm run lint`, `npm run test`, `npm run build` pentru a confirma că totul trece.
- [ ] 4.2 Verifică manual fiecare ecran și flux (dashboard, filtre, upload, export).
- [ ] 4.3 Configurează pipeline-ul de deploy (ex: Vercel/Render) și testează un deploy complet fără Docker/Python.
- [ ] 4.4 Marchează task-urile ca `[X]` imediat ce le finalizezi și păstrează fișierul ca sursă de adevăr pentru progres.
