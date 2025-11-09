# 🚀 START HERE - Expense Bot AI

## Fastest Way to Run Locally (No Docker!)

### Step 1: Run the Script

**macOS/Linux:**
```bash
./run_local.sh
```

**Windows:**
```bash
run_local.bat
```

### Step 2: Open Browser

Go to: **http://localhost:8000/docs**

### Step 3: Test the API

Click on any endpoint and try it out!

---

## What Just Happened?

The script automatically:
1. ✅ Created Python virtual environment
2. ✅ Installed all dependencies
3. ✅ Created SQLite database
4. ✅ Started FastAPI server

**No Docker, no PostgreSQL, no Redis needed!**

---

## Quick Tests

### Test 1: Health Check

```bash
curl http://localhost:8000/api/v1/health
```

### Test 2: Create Category

```bash
curl -X POST "http://localhost:8000/api/v1/categories" \
  -H "Content-Type: application/json" \
  -d '{"name": "Food", "color": "#FF9800", "icon": "🍔"}'
```

### Test 3: Add Expense with AI

```bash
curl -X POST "http://localhost:8000/api/v1/expenses/manual" \
  -H "Content-Type: application/json" \
  -d '{"text": "Bought coffee for 50 lei"}'
```

The AI will parse it and extract:
- Amount: 50
- Currency: MDL/lei
- Category: Food
- Vendor: (from context)

---

## What Works?

✅ **Photo Receipt Scanning** - Upload image → Groq AI extracts data
✅ **Voice Messages** - Upload audio → AI transcribes & parses
✅ **Text Entry** - Type naturally → AI structures it
✅ **Custom Categories** - Create your own expense categories
✅ **Encryption** - All sensitive data encrypted

---

## Files Created

- `expensebot.db` - SQLite database (your data)
- `venv/` - Python virtual environment

---

## Stop the Server

Press `Ctrl+C` in the terminal

---

## Need More Info?

- **Full Setup Guide**: [LOCAL_SETUP.md](LOCAL_SETUP.md)
- **API Examples**: [API_EXAMPLES.md](API_EXAMPLES.md)
- **Architecture**: [CLAUDE.md](CLAUDE.md)

---

## Troubleshooting

### "Command not found: ./run_local.sh"

```bash
chmod +x run_local.sh
./run_local.sh
```

### "Port 8000 already in use"

```bash
# Kill the process
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn app.main:app --reload --port 8001
```

### "Module not found"

```bash
source venv/bin/activate
pip install -r requirements-local.txt
```

---

## Development Workflow

1. **Edit code** in your favorite editor
2. **Save file** - server auto-restarts
3. **Test in browser** at http://localhost:8000/docs
4. Repeat!

---

**That's it! Happy coding!** 🎉
