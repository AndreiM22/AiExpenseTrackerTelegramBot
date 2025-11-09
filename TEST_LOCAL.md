# Test Local Docker Setup

## ⚠️ Înainte de Test

### 1. Pornește Docker Desktop
```bash
# Metodă 1: Din Applications
open -a Docker

# Metodă 2: Din Spotlight
# Apasă Cmd+Space și scrie "Docker"
```

**Așteaptă** până când iconița Docker din bara de sus arată că este "running" (nu mai are animație).

**Verifică**:
```bash
docker --version
# Trebuie să returneze: Docker version 24.x.x...
```

---

## 🧪 Test Setup Local (Development)

### Pasul 1: Verifică Setup
```bash
cd /Users/andreim./Desktop/TelegramBotAI
./verify_docker.sh
```

**Expected output**: Toate check-urile trebuie să arate `✓`

---

### Pasul 2: Creează fișierul app/main.py (Minimal pentru test)

Deocamdată nu ai `app/main.py`, deci trebuie să creezi un minimal FastAPI pentru test:

```bash
mkdir -p app
```

Creează `app/main.py`:
```python
from fastapi import FastAPI

app = FastAPI(title="Expense Bot AI")

@app.get("/")
async def root():
    return {"message": "Expense Bot AI is running!"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

---

### Pasul 3: Build Docker Image
```bash
# Development build (cu toate tools)
docker build --target development -t expense-bot-api:dev .
```

**Expected**: Build successful fără erori.

**Timp estimat**: 5-10 minute (prima dată - download dependencies)

---

### Pasul 4: Test Manual (fără docker-compose)

```bash
# Run container
docker run -d \
  --name test-expense-bot \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://test:test@localhost:5432/test \
  expense-bot-api:dev

# Check logs
docker logs -f test-expense-bot

# Test API
curl http://localhost:8000/health

# Stop și cleanup
docker stop test-expense-bot
docker rm test-expense-bot
```

---

### Pasul 5: Test cu Docker Compose (Development)

```bash
# Start development mode
make dev
# SAU
docker-compose up --build
```

**Expected**:
```
✓ Container expense-bot-api      Started
✓ Container expense-bot-db       Started
✓ Container expense-bot-redis    Started
```

**Verifică**:
```bash
# În alt terminal
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

# Check API docs
open http://localhost:8000/docs
```

---

### Pasul 6: Verifică Serviciile

```bash
# Status containere
docker-compose ps

# Expected output:
# NAME                  STATUS        PORTS
# expense-bot-api       Up           0.0.0.0:8000->8000/tcp
# expense-bot-db        Up (healthy) 0.0.0.0:5432->5432/tcp
# expense-bot-redis     Up           0.0.0.0:6379->6379/tcp
```

---

### Pasul 7: Test Database Connection

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U expenseuser -d expensebot

# În psql:
\l              # List databases
\dt             # List tables (none yet)
\q              # Quit
```

---

### Pasul 8: Test Redis

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# În redis-cli:
ping            # Expected: PONG
set test "Hello"
get test        # Expected: "Hello"
exit
```

---

### Pasul 9: Test Hot-Reload

```bash
# Development mode trebuie să fie pornit
docker-compose up

# Editează app/main.py (adaugă un endpoint)
# Salvează fișierul
# Verifică logs - trebuie să vezi "Reloading..."

# Test noul endpoint
curl http://localhost:8000/your-new-endpoint
```

---

### Pasul 10: Cleanup

```bash
# Stop toate serviciile
docker-compose down

# SAU cu ștergere volumes
docker-compose down -v
```

---

## ✅ Checklist Test Complet

- [ ] Docker Desktop pornit și running
- [ ] `./verify_docker.sh` - toate check-urile `✓`
- [ ] `app/main.py` creat cu FastAPI minimal
- [ ] `docker build` - success
- [ ] `make dev` - toate containerele UP
- [ ] `curl http://localhost:8000/health` - returnează `{"status":"healthy"}`
- [ ] `http://localhost:8000/docs` - API docs se încarcă
- [ ] Database connection - SUCCESS
- [ ] Redis connection - SUCCESS
- [ ] Hot-reload - funcționează
- [ ] `make down` - cleanup success

---

## 🐛 Troubleshooting Local

### Problema: Docker command not found
**Fix**:
```bash
# Pornește Docker Desktop
open -a Docker

# Așteaptă 30 secunde
docker --version
```

### Problema: Port 8000 already in use
**Fix**:
```bash
# Găsește procesul
lsof -i :8000

# Kill procesul
kill -9 <PID>

# SAU schimbă portul în docker-compose.yml
ports:
  - "9000:8000"
```

### Problema: Database connection error
**Fix**:
```bash
# Restart database
docker-compose restart db

# Verifică status
docker-compose exec db pg_isready -U expenseuser
```

### Problema: Build lent
**Explicație**: Prima dată durează 5-10 minute (download images + dependencies)
Build-urile următoare sunt mult mai rapide (cache).

### Problema: Container failed to start
**Fix**:
```bash
# Vezi erori
docker-compose logs app

# Rebuild fără cache
docker-compose build --no-cache app
docker-compose up
```

---

## 📊 Test Production Build (Local)

După ce development funcționează, poți testa și production build:

```bash
# Build production
docker build --target production -t expense-bot-api:prod .

# Run production local
docker run -d \
  --name test-prod \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://test:test@localhost:5432/test \
  expense-bot-api:prod

# Test
curl http://localhost:8000/health

# Cleanup
docker stop test-prod
docker rm test-prod
```

---

## 🔍 Comenzi Utile pentru Debugging

```bash
# Vezi toate containerele (inclusiv stopped)
docker ps -a

# Vezi logs în real-time
docker-compose logs -f

# Logs doar pentru app
docker-compose logs -f app

# Intrare în container pentru debugging
docker-compose exec app bash

# Verifică environment variables
docker-compose exec app env

# Verifică filesystem
docker-compose exec app ls -la /app

# Resource usage
docker stats

# Disk usage
docker system df

# Cleanup complete
docker system prune -a
```

---

## 📝 Next Steps După Test Local

După ce totul funcționează local:

1. **Implementează Database Models** (SQLAlchemy)
2. **Adaugă Groq AI Integration**
3. **Creează API Endpoints**
4. **Adaugă Authentication (JWT)**
5. **Write Tests**

Vezi [task.md](task.md) pentru task-uri detaliate.

---

## 🎯 Summary - Test Local

**Comenzi esențiale**:
```bash
# 1. Verifică setup
./verify_docker.sh

# 2. Creează app/main.py minimal
mkdir -p app && cat > app/main.py << 'EOF'
from fastapi import FastAPI
app = FastAPI(title="Expense Bot AI")

@app.get("/")
async def root():
    return {"message": "Expense Bot AI is running!"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
EOF

# 3. Start development
make dev

# 4. Test
curl http://localhost:8000/health
open http://localhost:8000/docs

# 5. Stop
make down
```

**Expected**: Totul funcționează local cu hot-reload! ✅
