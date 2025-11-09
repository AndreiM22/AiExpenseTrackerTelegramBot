# Quick Command Reference

## Start Application

```bash
# Automatic (Recommended)
./run_local.sh          # macOS/Linux
run_local.bat           # Windows

# Manual
source venv/bin/activate
uvicorn app.main:app --reload
```

## Database

```bash
# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "your message"

# Reset database
rm expensebot.db
alembic upgrade head

# View database
sqlite3 expensebot.db
```

## Testing

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Create category
curl -X POST http://localhost:8000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Food","color":"#FF9800","icon":"🍔"}'

# Add expense
curl -X POST http://localhost:8000/api/v1/expenses/manual \
  -H "Content-Type: application/json" \
  -d '{"text":"coffee 50 lei"}'

# List expenses
curl http://localhost:8000/api/v1/expenses
```

## URLs

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Stop Server

`Ctrl+C`

## Files

- `expensebot.db` - SQLite database
- `.env` - Configuration
- `venv/` - Virtual environment
- `app/` - Source code

## Common Issues

```bash
# Port in use
lsof -ti:8000 | xargs kill -9

# Reinstall deps
pip install -r requirements-local.txt

# Fresh start
rm -rf venv expensebot.db
./run_local.sh
```
