# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Expense Bot AI** - A Next.js-based expense tracking application with AI-powered data extraction using Groq AI. The application runs entirely on **Next.js 16 (App Router)** with TypeScript, eliminating the need for separate FastAPI backend or Docker for local development.

## Current Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Database**: Prisma + SQLite (dev.db) with planned Postgres support
- **Authentication**: NextAuth v4 with Credentials provider
- **AI Integration**: Groq SDK for manual expense parsing
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest with coverage
- **Deployment**: Vercel (serverless) or Docker (self-hosted)

### Monorepo Structure
```
TelegramBotAI/
├── apps/web/              # Main Next.js application
│   ├── src/
│   │   ├── app/          # Next.js App Router (pages + API routes)
│   │   ├── components/   # React components (layout, dashboard, auth)
│   │   ├── lib/          # Client utilities and types
│   │   ├── server/       # Server-side services
│   │   │   ├── ai/       # Groq AI integration (manual-expense.ts)
│   │   │   ├── mock-db.ts # In-memory data store with Prisma
│   │   │   └── prisma.ts  # Prisma client singleton
│   │   └── auth.ts       # NextAuth configuration
│   ├── prisma/
│   │   ├── schema.prisma # Database schema (Category, Expense)
│   │   └── dev.db        # SQLite database
│   └── package.json      # Web app dependencies
├── package.json          # Root proxy scripts
└── vercel.json           # Vercel deployment config
```

## Database Schema

**Prisma models** ([apps/web/prisma/schema.prisma](apps/web/prisma/schema.prisma)):
- **Category**: `id`, `name`, `color`, `icon`, `isDefault`, `expenses[]`
- **Expense**: `id`, `ownerId`, `source`, `amount`, `currency`, `vendor`, `purchaseDate`, `categoryId`, `aiConfidence`, `metadata` (JSON)

The application auto-seeds demo data on first API request via `ensureSeedData()` in [apps/web/src/server/mock-db.ts](apps/web/src/server/mock-db.ts).

## Development Commands

All commands are run from the repository root and proxy to `apps/web`:

```bash
# Development
npm run dev              # Start Next.js dev server on http://localhost:3000

# Code Quality
npm run lint             # Run ESLint
npm run format           # Run Prettier
npm run test             # Run Vitest tests with coverage

# Production
npm run build            # Build for production
npm run start            # Start production server
```

**Working directly in apps/web**:
```bash
cd apps/web
npm run dev
npm run test
npx prisma studio        # Open Prisma Studio to inspect SQLite DB
npx prisma generate      # Regenerate Prisma client after schema changes
```

## Environment Configuration

Copy [apps/web/.env.example](apps/web/.env.example) to `apps/web/.env`:

**Required variables**:
- `NEXTAUTH_SECRET` - Random secret for NextAuth JWT signing
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` - Login credentials for demo auth
- `DATABASE_URL` - SQLite path (`file:./prisma/dev.db`) or Postgres URL

**Optional integrations**:
- `GROQ_API_KEY` - Enable real Groq AI for manual expense parsing
- `TELEGRAM_BOT_TOKEN` - Enable Telegram webhook integration
- `TELEGRAM_WEBHOOK_SECRET` - Verify Telegram webhook requests
- `ENABLE_TELEGRAM_BOT=true` - Toggle Telegram bot features

**Important**: `NEXT_PUBLIC_API_URL` and `API_BASE_URL` should point to the domain (e.g., `http://localhost:3000`) **without** `/api` suffix.

## Authentication

- **Login route**: `/login` (NextAuth Credentials provider)
- **Middleware**: [apps/web/src/auth.ts](apps/web/src/auth.ts) protects all routes except `/login` and `/api/auth/*`
- **Session**: JWT-based with 24-hour expiration
- **User context**: Available via `next-auth` session in Server Components and API routes

## API Routes

All routes are in `apps/web/src/app/api/` and return JSON:

**Expenses**:
- `GET /api/v1/expenses` - List user expenses
- `GET /api/v1/expenses/[id]` - Get single expense
- `PUT /api/v1/expenses/[id]` - Update expense
- `DELETE /api/v1/expenses/[id]` - Delete expense
- `POST /api/v1/expenses/manual/preview` - Parse manual text input with Groq AI
- `POST /api/v1/expenses/manual/confirm` - Save parsed expense

**Categories**:
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/[id]` - Update category
- `DELETE /api/v1/categories/[id]` - Delete category
- `POST /api/v1/categories/suggest` - AI-suggest categories

**Statistics**:
- `GET /api/v1/statistics/summary` - Total/average expenses
- `GET /api/v1/statistics/by_category` - Group by category
- `GET /api/v1/statistics/by_vendor` - Group by vendor
- `GET /api/v1/statistics/trend` - Daily/weekly/monthly trends

**Telegram**:
- `POST /api/telegram/webhook` - Telegram bot webhook handler

## Groq AI Integration

The AI service is in [apps/web/src/server/ai/manual-expense.ts](apps/web/src/server/ai/manual-expense.ts):

- **Model**: `llama-3.3-70b-versatile` (configurable via `GROQ_MANUAL_MODEL`)
- **Input**: Plain text expense description (e.g., "Bought coffee at Starbucks for 45 lei")
- **Output**: Structured JSON with `vendor`, `amount`, `currency`, `category`, `items[]`, `confidence`
- **Fallback**: If `GROQ_API_KEY` is not set, uses local heuristic parsing

The preview/confirm flow:
1. `POST /api/v1/expenses/manual/preview` - Calls Groq AI, returns structured data
2. User reviews/edits in UI
3. `POST /api/v1/expenses/manual/confirm` - Saves to database

## Testing

Vitest is configured with:
- **Config**: [apps/web/vitest.config.ts](apps/web/vitest.config.ts)
- **Tests**: `src/**/*.{test,spec}.ts`
- **Coverage**: Text + lcov reports
- **Database**: Uses same SQLite `dev.db`, reset before each test suite

Run tests:
```bash
npm run test             # Run all tests with coverage
cd apps/web && npm test  # Same, from web directory
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub and connect repository in Vercel dashboard
2. Set environment variables in Vercel project settings
3. Deploy automatically on push to `main`, or manually via `vercel --prod`

Vercel config ([vercel.json](vercel.json)) handles monorepo install and build.

### Docker (Self-hosted)
1. Copy `apps/web/.env.production.example` to `apps/web/.env.production`
2. Set production environment variables (use `DATABASE_URL="file:/data/prisma/dev.db"` for persistence)
3. Deploy:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
4. Update:
   ```bash
   git pull
   docker compose -f docker-compose.prod.yml up -d --build
   ```

### GitHub Actions CI/CD
Workflow at `.github/workflows/deploy.yml`:
- Builds Docker image on push to `main`
- Pushes to GitHub Container Registry (`ghcr.io`)
- Optionally deploys to remote server via SSH if secrets are configured

## Key Implementation Notes

### NextAuth Middleware
NextAuth middleware is configured in [apps/web/src/auth.ts](apps/web/src/auth.ts). For Vercel/Turbopack compatibility, the middleware logic is in [apps/web/proxy.ts](apps/web/proxy.ts).

### Prisma Client
Always use the singleton from [apps/web/src/server/prisma.ts](apps/web/src/server/prisma.ts) to prevent connection exhaustion:
```typescript
import prisma from "@/server/prisma";
```

### Mock Data Store
The current implementation uses [apps/web/src/server/mock-db.ts](apps/web/src/server/mock-db.ts) which provides an in-memory store backed by Prisma. This can be replaced with direct Prisma queries when ready for production.

### Server-Only Imports
All server code (Prisma, Groq client) is marked with `"use server"` or imported only in API routes. Tests use a shim ([apps/web/src/test-utils/server-only-shim.ts](apps/web/src/test-utils/server-only-shim.ts)) to bypass Next.js server-only checks.

## Migration from Python/FastAPI

This codebase was migrated from a Python/FastAPI backend. The following have been removed:
- All Python code (`app/`, `migrations/`, `requirements.txt`, `alembic.ini`)
- Docker setup for local dev (Docker still used for production deployment)
- FastAPI endpoints (replaced with Next.js API routes)

See [TASKS_CLEANUP.md](TASKS_CLEANUP.md) for migration status.

## Current Development Status

**Completed**:
- Next.js 16 + TypeScript setup with App Router
- Prisma + SQLite database with auto-seeding
- NextAuth authentication with middleware protection
- Full CRUD API routes for expenses and categories
- Groq AI integration for manual expense parsing
- Telegram webhook handler
- Vitest test suite with coverage
- Docker production deployment
- Vercel deployment configuration

**Pending** (see [TASKS_CLEANUP.md](TASKS_CLEANUP.md)):
- Final verification of all UI flows
- Production deployment testing
- Photo/voice expense parsing (requires Groq vision/speech models)

## Additional Documentation

- [README.md](README.md) - Setup instructions and features (in Romanian)
- [TASKS_CLEANUP.md](TASKS_CLEANUP.md) - Migration checklist
- [DEPLOY_SERVER.md](DEPLOY_SERVER.md) - Server deployment guide
- [usegroq.md](usegroq.md) - Groq API reference
