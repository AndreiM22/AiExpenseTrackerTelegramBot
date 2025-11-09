# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Expense Bot AI** - A multi-platform expense tracking bot with AI-powered data extraction using Groq AI. The bot allows users to input expenses through:
- Photo receipts (Groq vision model extracts data)
- Voice messages (Groq speech-to-text with understanding)
- Manual text input (Groq LLM normalizes and categorizes)

## Current Status

This repository is in the **planning phase**. No code has been implemented yet. The repository contains:
- Comprehensive task breakdown ([task.md](task.md))
- Technical architecture specification ([tehnical-tasl.md](tehnical-tasl.md))
- Groq API reference documentation ([usegroq.md](usegroq.md))
- Environment configuration template ([.env](.env))

## Planned Architecture

### Backend Stack
- **Framework**: Python + FastAPI
- **Database**: PostgreSQL
- **AI Layer**: Groq AI (vision, speech, and text models)
- **Storage**: S3 or local filesystem
- **Authentication**: JWT + Telegram/Matrix/Chatwoot ID mapping
- **Encryption**: AES-GCM at application level
- **Containerization**: Docker + docker-compose

### Database Schema

Three core models:
1. **users** - User accounts with display_name, telegram mapping
2. **categories** - User-customizable expense categories (name, color, icon)
3. **expenses** - Expense records with:
   - Source type (photo | voice | manual)
   - Financial data (amount, currency, vendor, date)
   - Category reference
   - Encrypted json_data field with AI-parsed details
   - AI confidence score

### API Endpoints (Planned)

**Expense Management:**
- `POST /api/v1/expenses/photo` - Upload receipt photo
- `POST /api/v1/expenses/voice` - Upload voice message
- `POST /api/v1/expenses/manual` - Submit text input
- `GET /api/v1/expenses` - List user expenses

**Category Management:**
- `POST /api/v1/categories` - Create custom category
- `GET /api/v1/categories` - List user categories
- `PUT /api/v1/categories/{id}` - Update category
- `DELETE /api/v1/categories/{id}` - Delete category

**Authentication:**
- `POST /auth/telegram_bind` - Link Telegram account

## Groq AI Integration

### Expected JSON Response Format
All Groq AI endpoints (photo/voice/manual) return uniform JSON:
```json
{
  "amount": 249.90,
  "currency": "MDL",
  "vendor": "Linella",
  "purchase_date": "2025-11-02",
  "category": "Groceries",
  "items": [
    {"name": "Cafea Lavazza", "qty": 1, "price": 199.9},
    {"name": "Lapte", "qty": 1, "price": 50}
  ],
  "notes": "Bon fiscal",
  "language": "ro",
  "confidence": 0.94
}
```

### Service Structure
Create `services/groq_client.py` with:
- `parse_photo(file_path: str) -> dict` - Vision model for receipt OCR
- `parse_voice(file_path: str) -> dict` - Speech-to-text with understanding
- `parse_text(text: str, categories: list[str]) -> dict` - Text normalization

### Category Context
When calling Groq AI, pass user's custom categories in the prompt/context so the model aligns category suggestions with user preferences.

## Development Roadmap (MVP Tasks)

### Phase 1: Infrastructure (MVP-001 to MVP-003)
- Docker setup with FastAPI, Postgres, Redis
- SQLAlchemy models + Alembic migrations
- AES-GCM encryption utilities

### Phase 2: Groq Integration (MVP-004 to MVP-006)
- Groq client service with retry/logging
- FastAPI endpoints for all input types
- Parse and save encrypted expense data

### Phase 3: Categories (MVP-007 to MVP-008)
- CRUD endpoints for custom categories
- Integrate user categories into Groq prompts

### Phase 4: Security (MVP-009 to MVP-010)
- JWT authentication + Telegram binding
- User/group-based permissions and data isolation

### Phase 5: Testing & Deployment (MVP-011 to MVP-012)
- Unit tests for crypto, parsers, endpoints
- E2E permission tests
- Docker production deployment with health checks

See [task.md](task.md) for detailed subtasks and acceptance criteria.

## Security Considerations

- **Encryption**: All sensitive fields (json_data, vendor) encrypted with AES-GCM
- **Data Isolation**: Each user sees only their own expenses via `owner_user_id` filtering
- **Group Permissions**: Optional group sharing with RBAC (viewer/editor/admin)
- **API Keys**: Groq API key and encryption keys stored in environment variables
- **JWT Tokens**: 24-hour expiration

## Environment Variables

Required variables in `.env`:
```
GROQAPIKEY=<your-groq-api-key>
telegramToken=<your-telegram-bot-token>
DATABASE_URL=postgresql://user:pass@db:5432/expensebot
ENCRYPTION_KEY=<aes-encryption-key>
```

## When Implementing

1. **Start with infrastructure**: Set up Docker, FastAPI, PostgreSQL first
2. **Test encryption early**: Implement and test crypto utilities before building endpoints
3. **Groq API calls**: Reference [usegroq.md](usegroq.md) for API specifications
4. **Follow task order**: Tasks in [task.md](task.md) are dependency-ordered
5. **Security first**: Never skip encryption or permission checks
6. **User categories**: Always pass user's custom categories to Groq AI for better categorization

## Post-MVP Features

- CSV export by date/category range
- Web dashboard (React/Next.js)
- Google Sheets sync
- Daily expense summary notifications
