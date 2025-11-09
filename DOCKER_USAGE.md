# Docker Usage Guide - Expense Bot AI

## Structura Multi-Stage Dockerfile

Dockerfile-ul conține **4 stage-uri**:
1. **base** - Configurații de bază Python
2. **builder** - Build dependencies și instalare pachete
3. **development** - Target pentru development cu hot-reload
4. **production** - Target pentru production cu security hardening

---

## Comenzi Rapide

### Development (cu hot-reload)

```bash
# Build și start development
docker-compose up --build

# Sau în background
docker-compose up -d --build

# Vezi logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Production

```bash
# Build și start production
docker-compose -f docker-compose.prod.yml up --build -d

# Vezi logs
docker-compose -f docker-compose.prod.yml logs -f app

# Stop
docker-compose -f docker-compose.prod.yml down
```

---

## Build Manual (fără docker-compose)

### Development Build
```bash
docker build --target development -t expense-bot-api:dev .
```

### Production Build
```bash
docker build --target production -t expense-bot-api:prod .
```

### Run Container Manual
```bash
# Development
docker run -p 8000:8000 \
  -v $(pwd)/app:/app/app \
  --env-file .env \
  expense-bot-api:dev

# Production
docker run -p 8000:8000 \
  -v uploads:/app/uploads \
  -v logs:/app/logs \
  --env-file .env \
  expense-bot-api:prod
```

---

## Funcționalități Dockerfile

### 1. Multi-Stage Build
- **Avantaj**: Imagine finală mai mică (fără build dependencies)
- **Development**: ~800MB (cu dev tools)
- **Production**: ~600MB (minimal runtime)

### 2. Health Checks
```bash
# Verifică health status
docker inspect --format='{{json .State.Health}}' expense-bot-api | jq
```

Health check endpoint: `http://localhost:8000/health`

### 3. Non-Root User (Production)
- User: `botuser` (UID 1000)
- Security: Rulează fără root privileges

### 4. Volume Mounts
```yaml
volumes:
  - uploads_data:/app/uploads    # Receipt images
  - logs_data:/app/logs          # Application logs
```

### 5. Graceful Shutdown
- SIGTERM pentru graceful shutdown
- Gunicorn: 30s graceful timeout

### 6. Build Arguments
```bash
# Schimbă versiunea Python
docker build --build-arg PYTHON_VERSION=3.12 -t expense-bot-api .

# Schimbă portul
docker build --build-arg APP_PORT=9000 -t expense-bot-api .
```

---

## Environment Files

### .env (Development)
```env
GROQAPIKEY=your-groq-api-key
telegramToken=your-telegram-token
DATABASE_URL=postgresql://expenseuser:expensepass@db:5432/expensebot
ENCRYPTION_KEY=your-encryption-key
REDIS_URL=redis://redis:6379
```

### .env.production (Production)
```env
GROQAPIKEY=your-prod-groq-key
telegramToken=your-prod-telegram-token
DATABASE_URL=postgresql://produser:strongpass@db:5432/expensebot
ENCRYPTION_KEY=your-strong-encryption-key
REDIS_URL=redis://redis:6379
LOG_LEVEL=info
```

---

## Dependencies Instalate

### Runtime Dependencies (ambele targets)
- **postgresql-client** - Database access
- **imagemagick** - Image processing pentru receipts
- **ffmpeg** - Audio processing pentru voice messages
- **libsndfile1** - Audio file support
- **curl** - Health checks

### Development Dependencies (doar development)
- **pytest** - Unit testing
- **black** - Code formatting
- **mypy** - Type checking
- **flake8** - Linting
- **ipython** - Interactive shell

---

## Monitoring & Debugging

### Vezi logs în real-time
```bash
# Toate serviciile
docker-compose logs -f

# Doar app
docker-compose logs -f app

# Ultimele 100 linii
docker-compose logs --tail=100 app
```

### Intrare în container
```bash
# Development
docker-compose exec app bash

# Production (rulează ca botuser)
docker-compose -f docker-compose.prod.yml exec app bash
```

### Verifică resurse
```bash
# CPU & Memory usage
docker stats

# Disk usage
docker system df
```

### Health Check Manual
```bash
# Din exterior
curl http://localhost:8000/health

# Din container
docker-compose exec app curl http://localhost:8000/health
```

---

## Troubleshooting

### 1. Build fails - libpq-dev missing
```bash
# Rebuild fără cache
docker-compose build --no-cache
```

### 2. Permission denied în production
```bash
# Verifică ownership
docker-compose exec app ls -la /app

# Fix permissions
docker-compose exec app chown -R botuser:botuser /app/uploads
```

### 3. Database connection fails
```bash
# Verifică db health
docker-compose exec db pg_isready -U expenseuser

# Verifică conexiunea
docker-compose exec app psql $DATABASE_URL -c "SELECT 1"
```

### 4. Redis connection fails
```bash
# Test Redis
docker-compose exec redis redis-cli ping
```

### 5. Hot-reload nu funcționează
```bash
# Verifică volume mount
docker-compose exec app ls -la /app/app

# Restart cu volume fresh
docker-compose down -v && docker-compose up --build
```

---

## Performance Optimization

### Production Settings

**Gunicorn Workers**: 4 workers (ajustează după CPU)
```python
workers = (2 * CPU_COUNT) + 1
```

**Timeouts**:
- Request timeout: 120s
- Graceful shutdown: 30s

### Resource Limits (docker-compose.prod.yml)
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 512M
```

---

## Cleanup

### Remove containers și volumes
```bash
# Stop și șterge containere
docker-compose down

# Șterge și volumes (ATENȚIE: pierde date!)
docker-compose down -v

# Curăță imagini vechi
docker image prune -a

# Curăță tot sistemul Docker
docker system prune -a --volumes
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Build Docker Image
  run: |
    docker build --target production -t expense-bot-api:${{ github.sha }} .

- name: Push to Registry
  run: |
    docker tag expense-bot-api:${{ github.sha }} registry.example.com/expense-bot-api:latest
    docker push registry.example.com/expense-bot-api:latest
```

---

## Securitate

### Production Checklist
- [ ] Non-root user (botuser) ✓
- [ ] Health checks active ✓
- [ ] Encryption key în .env.production
- [ ] Strong database password
- [ ] Volumes pentru persistent data ✓
- [ ] Network isolation ✓
- [ ] Resource limits ✓
- [ ] Graceful shutdown ✓

### Scanare Vulnerabilități
```bash
# Trivy scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image expense-bot-api:prod

# Snyk scan
snyk container test expense-bot-api:prod
```

---

## FAQ

**Q: Diferența între development și production?**
- Development: hot-reload, dev tools, rulează ca root
- Production: Gunicorn, non-root user, minimal dependencies

**Q: Pot folosi alt port?**
```bash
docker-compose up -p 9000:8000
```

**Q: Cum actualizez dependencies?**
```bash
# Editează requirements.txt
docker-compose build --no-cache app
docker-compose up -d app
```

**Q: Logs persistente?**
Logs sunt salvate în volume `logs_data:/app/logs`
```bash
docker-compose exec app tail -f /app/logs/access.log
```
