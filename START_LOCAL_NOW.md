# 🚀 Start Local ACUM - Ghid Rapid

## Pasul 1: Pornește Docker Desktop

```bash
# Deschide Docker Desktop
open -a Docker
```

**Așteaptă 30-60 secunde** până când Docker Desktop pornește complet (iconița din bara de sus nu mai are animație).

---

## Pasul 2: Verifică că Docker funcționează

```bash
cd /Users/andreim./Desktop/TelegramBotAI

# Test Docker
docker --version
# Expected: Docker version 24.x.x...

# Verifică setup complet
./verify_docker.sh
```

**Dacă vezi erori**: Așteaptă încă 30 secunde și încearcă din nou.

---

## Pasul 3: Creează fișiere lipsă (dacă sunt erori de import)

### A. Verifică ce lipsește
```bash
ls -la app/
ls -la app/api/
ls -la app/utils/
```

### B. Creează structura minimă (dacă lipsește)

```bash
# Creează directoare
mkdir -p app/api app/utils app/models app/services

# Creează fișiere __init__.py
touch app/api/__init__.py
touch app/utils/__init__.py
touch app/models/__init__.py
touch app/services/__init__.py
```

### C. Creează app/utils/config.py (minimal)
```bash
cat > app/utils/config.py << 'EOF'
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Expense Bot AI"
    debug: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
EOF
```

### D. Creează module API (minimal - fără erori de import)
```bash
# app/api/auth.py
cat > app/api/auth.py << 'EOF'
from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
async def auth_status():
    return {"status": "auth module ready"}
EOF

# app/api/expenses.py
cat > app/api/expenses.py << 'EOF'
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_expenses():
    return {"expenses": []}
EOF

# app/api/categories.py
cat > app/api/categories.py << 'EOF'
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_categories():
    return {"categories": []}
EOF

# app/api/webhook.py
cat > app/api/webhook.py << 'EOF'
from fastapi import APIRouter

router = APIRouter()

@router.post("/webhook")
async def telegram_webhook():
    return {"status": "webhook ready"}
EOF
```

---

## Pasul 4: Start Docker Compose (Development)

```bash
# Start toate serviciile
make dev
```

**SAU manual**:
```bash
docker-compose up --build
```

**Expected output**:
```
✓ Network expense-bot-network    Created
✓ Container expense-bot-db       Started
✓ Container expense-bot-redis    Started
✓ Container expense-bot-api      Started
```

**Logs**:
```
expense-bot-api  | INFO:     Started server process
expense-bot-api  | INFO:     Waiting for application startup
expense-bot-api  | INFO:     Application startup complete
expense-bot-api  | INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Pasul 5: Test API-ul

### A. Health Check
```bash
curl http://localhost:8000/api/v1/health
```

**Expected**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "service": "expense-bot-ai"
}
```

### B. Root Endpoint
```bash
curl http://localhost:8000/
```

**Expected**:
```json
{
  "message": "Expense Bot AI - API is running"
}
```

### C. API Docs (în browser)
```bash
open http://localhost:8000/docs
```

**Expected**: Swagger UI cu toate endpoint-urile tale.

---

## Pasul 6: Verifică Database și Redis

### Database
```bash
# Connect to PostgreSQL
docker-compose exec db psql -U expenseuser -d expensebot

# În psql:
\l              # List databases
\q              # Quit
```

### Redis
```bash
# Connect to Redis
docker-compose exec redis redis-cli

# În redis-cli:
ping            # Expected: PONG
exit
```

---

## Pasul 7: Vezi Logs în Real-Time

```bash
# Toate serviciile
docker-compose logs -f

# Doar app
docker-compose logs -f app

# Ultimele 50 linii
docker-compose logs --tail=50 app
```

**Press `Ctrl+C`** pentru a opri urmărirea logs.

---

## Pasul 8: Test Hot-Reload

1. **Lasă docker-compose să ruleze**
2. **Editează** `app/main.py`:
   ```python
   @app.get("/test")
   async def test_endpoint():
       return {"message": "Hot reload works!"}
   ```
3. **Salvează** fișierul
4. **Verifică logs** - trebuie să vezi:
   ```
   INFO:     Detected file change, reloading...
   ```
5. **Test**:
   ```bash
   curl http://localhost:8000/test
   # Expected: {"message": "Hot reload works!"}
   ```

---

## Pasul 9: Stop Docker

```bash
# Stop toate serviciile
make down
```

**SAU**:
```bash
docker-compose down
```

**Cleanup complet** (șterge și volumes):
```bash
docker-compose down -v
```

---

## ✅ Checklist Rapid

După ce pornești Docker:

- [ ] `docker --version` - funcționează
- [ ] `make dev` - toate containerele UP
- [ ] `curl http://localhost:8000/api/v1/health` - SUCCESS
- [ ] `open http://localhost:8000/docs` - Swagger UI se încarcă
- [ ] Database connection - funcționează
- [ ] Redis ping - funcționează
- [ ] Hot-reload - funcționează
- [ ] `make down` - cleanup success

---

## 🐛 Probleme Comune

### ❌ Error: Cannot connect to Docker daemon
**Fix**:
```bash
# Pornește Docker Desktop
open -a Docker

# Așteaptă 1 minut
docker ps
```

### ❌ Error: Port 8000 already in use
**Fix**:
```bash
# Găsește și kill procesul
lsof -i :8000
kill -9 <PID>

# SAU schimbă portul în docker-compose.yml
ports:
  - "9000:8000"
```

### ❌ Error: ModuleNotFoundError: No module named 'app.api'
**Fix**: Rulează comenzile din **Pasul 3** pentru a crea modulele lipsă.

### ❌ Build lent (5-10 minute)
**Normal**: Prima dată durează mult (download dependencies).
Build-urile următoare sunt mult mai rapide (cache).

### ❌ Container failed to start
**Fix**:
```bash
# Vezi erori detaliate
docker-compose logs app

# Rebuild fără cache
docker-compose build --no-cache
docker-compose up
```

---

## 🎯 Comenzi Utile

```bash
# Status containere
docker-compose ps

# Restart un serviciu
docker-compose restart app

# Intrare în container
docker-compose exec app bash

# Resource usage
docker stats

# Cleanup imagini vechi
docker system prune -a
```

---

## 📝 Next Steps

După ce totul funcționează local:

1. **Implementează Database Models** → Creează tabele
2. **Integrează Groq AI** → Parsing receipts/voice
3. **Adaugă Endpoints** → CRUD operations
4. **Write Tests** → pytest
5. **Deploy pe Server** → Folosește [DEPLOY_SIMPLU.md](DEPLOY_SIMPLU.md)

---

## 🚀 Summary - One Command Start

După ce ai creat fișierele lipsă (Pasul 3):

```bash
# Pornește Docker Desktop
open -a Docker && sleep 30

# Start development
make dev

# Test
curl http://localhost:8000/api/v1/health
```

**Gata! API-ul rulează local pe http://localhost:8000** 🎉

---

## 📚 Documentație

- [TEST_LOCAL.md](TEST_LOCAL.md) - Ghid detaliat testare
- [QUICK_START.md](QUICK_START.md) - Development guide
- [DOCKER_USAGE.md](DOCKER_USAGE.md) - Docker details

**Start aici: [TEST_LOCAL.md](TEST_LOCAL.md)**
