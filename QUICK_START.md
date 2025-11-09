# Quick Start Guide - Expense Bot AI

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- `.env` file configured

---

## 1. Verificare Setup

```bash
# Rulează scriptul de verificare
./verify_docker.sh
```

---

## 2. Development Mode (Recomandat pentru început)

### Start Development
```bash
docker-compose up --build
```

Sau în background:
```bash
docker-compose up -d --build
```

### Vezi Logs
```bash
docker-compose logs -f app
```

### Stop Development
```bash
docker-compose down
```

### Acces API
- **URL**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

---

## 3. Production Mode

### Build Production
```bash
docker-compose -f docker-compose.prod.yml build
```

### Start Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Monitoring
```bash
# Vezi toate serviciile
docker-compose -f docker-compose.prod.yml ps

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Resource usage
docker stats
```

### Stop Production
```bash
docker-compose -f docker-compose.prod.yml down
```

---

## 4. Comenzi Utile

### Build fără cache (dacă apar probleme)
```bash
docker-compose build --no-cache
```

### Restart un singur serviciu
```bash
docker-compose restart app
```

### Intrare în container pentru debugging
```bash
docker-compose exec app bash
```

### Vezi volumele create
```bash
docker volume ls
```

### Curăță volumele (ATENȚIE: șterge datele!)
```bash
docker-compose down -v
```

### Database access
```bash
docker-compose exec db psql -U expenseuser -d expensebot
```

### Redis CLI
```bash
docker-compose exec redis redis-cli
```

---

## 5. Troubleshooting Rapid

### Problema: Port 8000 deja folosit
```bash
# Schimbă portul în docker-compose.yml
ports:
  - "9000:8000"  # Folosește portul 9000 în loc de 8000
```

### Problema: Permission denied
```bash
# Rebuild complet
docker-compose down -v
docker-compose up --build
```

### Problema: Database connection error
```bash
# Verifică dacă DB e pornit
docker-compose ps db

# Restart DB
docker-compose restart db

# Verifică logs DB
docker-compose logs db
```

### Problema: Build lent
```bash
# Prima dată durează ~5-10 minute
# Build-urile următoare sunt mai rapide (cache)

# Pentru build super rapid (doar app):
docker-compose up --build app
```

---

## 6. Testing

### Run tests în container
```bash
docker-compose exec app pytest
```

### Cu coverage
```bash
docker-compose exec app pytest --cov=app --cov-report=html
```

### Linting
```bash
docker-compose exec app black app/
docker-compose exec app flake8 app/
docker-compose exec app mypy app/
```

---

## 7. Structura Proiectului

```
TelegramBotAI/
├── Dockerfile                 # Multi-stage Dockerfile
├── docker-compose.yml         # Development setup
├── docker-compose.prod.yml    # Production setup
├── .dockerignore             # Files excluse din build
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables
├── verify_docker.sh          # Verification script
├── DOCKER_USAGE.md           # Documentație detaliată
├── QUICK_START.md            # Acest fișier
└── app/
    ├── main.py              # FastAPI application
    ├── models/              # Database models
    ├── services/            # Groq AI, crypto
    └── api/                 # API routes
```

---

## 8. Workflow Recomandat

### Prima dată (Setup)
```bash
# 1. Verifică setup
./verify_docker.sh

# 2. Creează .env file
cp .env.example .env
# Editează .env cu API keys

# 3. Build și start
docker-compose up --build
```

### Development zilnic
```bash
# Start
docker-compose up -d

# Vezi logs
docker-compose logs -f app

# Stop la final
docker-compose down
```

### Când faci schimbări în cod
- **Python files**: Hot-reload automat (nu trebuie rebuild)
- **requirements.txt**: Rebuild necesar
```bash
docker-compose up --build app
```
- **Dockerfile**: Rebuild complet
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 9. Health Check

```bash
# Quick check
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-07T10:30:00Z"
}
```

---

## 10. Production Deployment

```bash
# 1. Creează .env.production
cp .env .env.production
# Editează cu production keys

# 2. Build production
docker-compose -f docker-compose.prod.yml build

# 3. Start production
docker-compose -f docker-compose.prod.yml up -d

# 4. Verifică health
curl http://localhost:8000/health

# 5. Monitorizează logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Next Steps

1. ✅ Docker setup complet
2. ⏭️ Implementează health check endpoint în FastAPI
3. ⏭️ Creează database models (SQLAlchemy)
4. ⏭️ Integrează Groq AI client
5. ⏭️ Adaugă authentication (JWT)

Vezi [task.md](task.md) pentru task-uri detaliate.

---

## Support

Pentru mai multe detalii vezi:
- [DOCKER_USAGE.md](DOCKER_USAGE.md) - Documentație completă Docker
- [CLAUDE.md](CLAUDE.md) - Project overview
- [tehnical-task.md](tehnical-task.md) - Architecture specification

---

**Happy Coding! 🚀**
