# Expense Bot AI

AI-powered expense tracking bot that extracts expense data from photos, voice messages, and manual text input using Groq AI.

## Features

- **Photo Receipt Scanning**: Upload receipt photos - Groq vision AI extracts all expense details
- **Voice Input**: Record voice messages - Groq speech model transcribes and parses expenses
- **Manual Text Entry**: Type expenses naturally - AI normalizes and categorizes automatically
- **Custom Categories**: Define your own expense categories with colors and icons
- **End-to-End Encryption**: All sensitive data encrypted with AES-GCM
- **Multi-platform**: Telegram bot integration ready
- **Privacy First**: User data isolation with group sharing support

## Tech Stack

- **Backend**: Python 3.11 + FastAPI
- **Database**: PostgreSQL 15
- **AI**: Groq AI (LLaMA, Whisper, Vision models)
- **Encryption**: AES-GCM with cryptography library
- **ORM**: SQLAlchemy + Alembic migrations

## Quick Start (npm + FastAPI, fără Docker)

### Prerequisites

- Python **3.11** (cu `pip` și `venv`)
- Node.js **18+** și `npm`
- SQLite (implicit) sau un Postgres accesibil dacă setezi `DATABASE_URL`
- Groq API key + Telegram Bot Token

### Instalare & rulare

```bash
git clone <repo>
cd TelegramBotAI

cp .env.example .env                  # sau ./scripts/bootstrap_env.sh
# completează GROQ_API_KEY, TELEGRAM_BOT_TOKEN, ENCRYPTION_KEY etc.

npm install                           # instalează frontend-ul + unelte
npm run bootstrap                     # pregătește venv-ul Python + migrațiile
npm run dev                           # pornește FastAPI (8000) + Next.js (3000)
```

- `npm run bootstrap` rulează `scripts/backend_setup.sh`: creează `./venv`, instalează `requirements-local.txt`, aplică migrațiile din `migrations/`.
- `npm run dev` folosește `concurrently` pentru a porni backend-ul (`uvicorn app.main:app --reload`) și interfața Next.js (`expense-web`).
- Dacă nu setezi `DATABASE_URL`, se va folosi local `sqlite:///./expensebot.db`. Șterge fișierul `expensebot.db` dacă vrei un reset rapid și rulează din nou `npm run bootstrap`.

### Scripturi utile

| Comandă | Ce face |
| --- | --- |
| `npm run backend:setup` | Doar configurează venv-ul + migrațiile (pas din `bootstrap`) |
| `npm run backend:dev` | Pornește doar FastAPI (ideal pentru debugging API) |
| `npm run web:dev` | Pornește doar Next.js |
| `npm run web:build` | Build de producție pentru UI (`expense-web/.next`) |
| `npm run web:start` | Rulează build-ul de producție |

> Pentru development local setează în `.env`: `NEXT_PUBLIC_API_URL=http://localhost:8000/api` și `API_BASE_URL=http://localhost:8000`. Când expui aplicația în producție actualizează aceste valori la domeniul public al API-ului.

### Deploy fără Docker

1. Rulează `npm run backend:setup` pe server (creează venv-ul și aplică migrații).
2. Pornește API-ul cu `source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000` (sau configurează `gunicorn`/`supervisor`).
3. Pentru UI: `npm run web:build && npm run web:start`.
4. Montează în față un reverse proxy (Nginx, Caddy etc.) care trimite `/api/*` către FastAPI și restul către Next.js.

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Expenses
- `POST /api/v1/expenses/photo` - Upload receipt photo
- `POST /api/v1/expenses/voice` - Upload voice message
- `POST /api/v1/expenses/manual` - Submit text expense
- `GET /api/v1/expenses` - List all expenses

#### Categories
- `POST /api/v1/categories` - Create category
- `GET /api/v1/categories` - List categories
- `PUT /api/v1/categories/{id}` - Update category
- `DELETE /api/v1/categories/{id}` - Delete category

#### Authentication
- `POST /auth/telegram_bind` - Bind Telegram account

### Example Usage

**Manual Text Entry:**
```bash
curl -X POST "http://localhost:8000/api/v1/expenses/manual" \
  -H "Content-Type: application/json" \
  -d '{"text": "Am cumpărat cafea la Starbucks, 50 lei"}'
```

Response:
```json
{
  "status": "success",
  "expense_id": "123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "amount": 50.0,
    "currency": "MDL",
    "vendor": "Starbucks",
    "category": "Food",
    "confidence": 0.95
  }
}
```

**Photo Upload:**
```bash
curl -X POST "http://localhost:8000/api/v1/expenses/photo" \
  -F "file=@receipt.jpg"
```

**Create Custom Category:**
```bash
curl -X POST "http://localhost:8000/api/v1/categories" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Groceries",
    "color": "#4CAF50",
    "icon": "🛒"
  }'
```

## Development

### Project Structure

```
TelegramBotAI/
├── app/
│   ├── api/              # API endpoints
│   │   ├── auth.py
│   │   ├── categories.py
│   │   ├── expenses.py
│   │   └── schemas.py
│   ├── models/           # SQLAlchemy models
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── expense.py
│   │   └── database.py
│   ├── services/         # Business logic
│   │   └── groq_client.py
│   ├── utils/            # Utilities
│   │   ├── config.py
│   │   └── crypto.py
│   └── main.py           # FastAPI app
├── migrations/           # Alembic migrations
├── scripts/              # npm helper scripts (backend_setup, backend_dev, etc.)
├── expense-web/          # Next.js dashboard
├── tests/                # Unit tests
├── requirements-local.txt
└── package.json
```

### Running Tests

```bash
source venv/bin/activate                   # după npm run backend:setup
pip install -r requirements-local.txt
pytest tests
```

### Database Migrations

```bash
source venv/bin/activate
alembic revision --autogenerate -m "description"
alembic upgrade head        # apply
alembic downgrade -1        # rollback
```

## Security

- **Encryption**: All sensitive data (vendor names, json_data) encrypted with AES-GCM
- **User Isolation**: Each user sees only their own expenses
- **Group Permissions**: Optional group sharing with role-based access
- **JWT Authentication**: 24-hour token expiration
- **Environment Variables**: Sensitive keys stored in .env (never committed)

## Groq AI Integration

### Models Used

- **Text/Chat**: `llama-3.3-70b-versatile` - Expense parsing from text
- **Vision**: `llama-3.2-90b-vision-preview` - Receipt OCR and parsing
- **Speech**: `whisper-large-v3` - Voice transcription

### Response Format

All Groq endpoints return a consistent JSON structure:
```json
{
  "amount": 250.50,
  "currency": "MDL",
  "vendor": "Kaufland",
  "purchase_date": "2025-11-02",
  "category": "Groceries",
  "items": [
    {"name": "Coffee", "qty": 1, "price": 199.90},
    {"name": "Milk", "qty": 1, "price": 50.60}
  ],
  "notes": "Receipt info",
  "language": "ro",
  "confidence": 0.94
}
```

## Roadmap

### MVP (Completed)
- ✅ npm + FastAPI toolchain (venv + Next.js)
- ✅ Database models and migrations
- ✅ AES-GCM encryption
- ✅ Groq AI integration
- ✅ Photo/Voice/Manual endpoints
- ✅ Custom categories
- ⚠️ JWT authentication (TODO)
- ⚠️ User/group permissions (TODO)

### Post-MVP
- [ ] Telegram bot interface
- [ ] CSV export functionality
- [ ] Web dashboard (React/Next.js)
- [ ] Google Sheets sync
- [ ] Daily expense notifications
- [ ] Multi-currency support
- [ ] Expense analytics

## License

MIT

## Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: See [CLAUDE.md](CLAUDE.md) for development guide
