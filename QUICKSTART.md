# Quick Start Guide

Get the Expense Bot AI running in under 5 minutes!

## Prerequisites

- Docker Desktop installed and running
- Text editor (VS Code recommended)
- Terminal/Command Prompt

## Step-by-Step Setup

### 1. Environment Configuration

The `.env` file is already configured with working credentials:

```bash
# Your .env is ready with:
# - Groq API Key: ✅ Configured
# - Telegram Token: ✅ Configured
# - Database URL: ✅ Configured
# - Encryption Key: ✅ Configured
```

**No changes needed!** The project is ready to run.

### 2. Start Services

```bash
# Start all services (FastAPI, PostgreSQL, Redis)
docker-compose up --build
```

Wait for the output:
```
expense-bot-api  | INFO:     Application startup complete.
expense-bot-api  | INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. Run Database Migrations

Open a new terminal and run:

```bash
# Apply database migrations
docker-compose exec app alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade  -> <revision>, Initial migration
```

### 4. Verify Setup

Open your browser: **http://localhost:8000/docs**

You should see the Swagger UI with all endpoints!

Or test with curl:
```bash
curl http://localhost:8000/api/v1/health
```

Response:
```json
{"status":"healthy","version":"1.0.0","service":"expense-bot-ai"}
```

## First API Calls

### Create a Category

```bash
curl -X POST "http://localhost:8000/api/v1/categories" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Food",
    "color": "#FF9800",
    "icon": "🍔"
  }'
```

### Add an Expense (Text)

```bash
curl -X POST "http://localhost:8000/api/v1/expenses/manual" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bought coffee at Starbucks for 50 MDL"
  }'
```

The Groq AI will:
1. Parse the text
2. Extract amount (50), currency (MDL), vendor (Starbucks)
3. Suggest category (Food - from your custom categories)
4. Save encrypted to database

### List Expenses

```bash
curl http://localhost:8000/api/v1/expenses
```

## Development Workflow

### Stop Services

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Just the API
docker-compose logs -f app

# Database
docker-compose logs -f db
```

### Access Database

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U expenseuser -d expensebot

# List tables
\dt

# Query expenses
SELECT id, amount, currency, source, created_at FROM expenses;

# Exit
\q
```

### Code Changes

The app uses hot-reload! Just edit Python files and the server restarts automatically.

Example:
1. Edit `app/main.py`
2. Save file
3. Watch terminal: `INFO: Application reload detected`

## Interactive Testing

Best way to test: **Swagger UI**

1. Open http://localhost:8000/docs
2. Click on any endpoint (e.g., `POST /api/v1/expenses/manual`)
3. Click "Try it out"
4. Edit the request body
5. Click "Execute"
6. See the response!

## Common Issues

### Port already in use

```bash
# Change port in docker-compose.yml
ports:
  - "8001:8000"  # Use 8001 instead
```

### Database connection failed

```bash
# Check if Postgres is running
docker-compose ps

# Restart only db
docker-compose restart db
```

### Groq API errors

Check your API key in `.env`:
```bash
cat .env | grep GROQ_API_KEY
```

Visit https://console.groq.com to verify your key is active.

## Project Structure

```
TelegramBotAI/
├── app/
│   ├── api/              # REST endpoints
│   │   ├── auth.py       # Authentication (placeholder)
│   │   ├── categories.py # Category CRUD
│   │   ├── expenses.py   # Expense endpoints
│   │   └── schemas.py    # Pydantic models
│   ├── models/           # Database models
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── expense.py
│   │   ├── group.py
│   │   └── database.py
│   ├── services/         # Business logic
│   │   └── groq_client.py # Groq AI integration
│   ├── utils/            # Utilities
│   │   ├── config.py     # Settings
│   │   └── crypto.py     # AES encryption
│   └── main.py           # FastAPI app
├── migrations/           # Alembic DB migrations
├── tests/                # Unit tests
├── docker-compose.yml    # Docker services
├── Dockerfile            # App container
└── requirements.txt      # Python dependencies
```

## Next Steps

1. **Read the docs:**
   - [README.md](README.md) - Full documentation
   - [API_EXAMPLES.md](API_EXAMPLES.md) - All API examples
   - [CLAUDE.md](CLAUDE.md) - Architecture guide
   - [MVP_STATUS.md](MVP_STATUS.md) - Implementation status

2. **Test features:**
   - Upload a receipt photo
   - Record a voice message
   - Create custom categories
   - Test Groq AI parsing

3. **Implement missing features:**
   - JWT authentication (MVP-009)
   - User permissions (MVP-010)
   - Unit tests (MVP-011)
   - Production deployment (MVP-012)

## Support

- **Groq Docs**: https://console.groq.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **SQLAlchemy**: https://docs.sqlalchemy.org

---

**Happy coding!** 🚀

The MVP is 73% complete - all core features work:
- ✅ Photo receipt scanning
- ✅ Voice message parsing
- ✅ Manual text entry
- ✅ Custom categories
- ✅ Encryption
- ✅ Groq AI integration
