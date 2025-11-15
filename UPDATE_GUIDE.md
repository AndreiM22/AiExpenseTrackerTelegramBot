# Ghid Actualizare Cod pe Server

## Scenariul Tipic: Am făcut modificări în cod

### 1️⃣ Local - Commit și Push
```bash
# După ce ai făcut modificări în cod
git add .
git commit -m "Descriere modificări"
git push
```

### 2️⃣ Pe Server - Update Manual (Quick)
```bash
# Conectează-te la server
ssh root@65.21.110.105

# Mergi în directorul aplicației
cd /opt/expensebot

# Pull ultimele modificări
git pull

# Rebuild și restart containerul
docker compose -f docker-compose.prod.yml up -d --build

# Verifică că merge
docker compose -f docker-compose.prod.yml logs --tail=50 -f
```

### 3️⃣ Sau Automată - GitHub Actions (Recommended)

**GitHub Actions va face automat totul când faci push pe `main`!**

Push-ul tău declanșează automat:
1. ✅ Build Docker image
2. ✅ Push la GitHub Container Registry
3. ✅ Deploy pe server via SSH
4. ✅ Pull image
5. ✅ Restart container
6. ✅ Health check

**Pentru a activa acest workflow:**
- Configurează GitHub Secrets (vezi mai jos)
- Fă push pe branch `main`
- GitHub Actions se ocupă de rest automat!

---

## Comenzi Utile pe Server

### Verificare Status
```bash
cd /opt/expensebot

# Status containere
docker compose -f docker-compose.prod.yml ps

# Logs în timp real
docker compose -f docker-compose.prod.yml logs -f

# Logs ultimele 100 linii
docker compose -f docker-compose.prod.yml logs --tail=100
```

### Restart Rapid (fără rebuild)
```bash
cd /opt/expensebot
docker compose -f docker-compose.prod.yml restart
```

### Rebuild Complet (după modificări cod)
```bash
cd /opt/expensebot
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Stop/Start
```bash
cd /opt/expensebot

# Stop
docker compose -f docker-compose.prod.yml down

# Start
docker compose -f docker-compose.prod.yml up -d
```

### Curățare (când vrei fresh start)
```bash
cd /opt/expensebot

# Stop tot
docker compose -f docker-compose.prod.yml down

# Șterge volume (⚠️ ATENȚIE: șterge baza de date!)
docker compose -f docker-compose.prod.yml down -v

# Start fresh
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Workflow Recomandat: GitHub Actions Automat

### Setup Inițial (o singură dată)

**1. Configurare GitHub Secrets**

Mergi pe GitHub:
```
Repository → Settings → Secrets and variables → Actions → New repository secret
```

Adaugă aceste 3 secrets:
- **DEPLOY_HOST**: `65.21.110.105` (IP-ul serverului tău)
- **DEPLOY_USER**: `root` (sau user-ul SSH)
- **DEPLOY_KEY**: cheia SSH privată (paste ca text)

**Cum să obții cheia SSH:**
```bash
# Pe serverul tău sau local (unde ai acces SSH la server)
cat ~/.ssh/id_rsa
# sau
cat ~/.ssh/id_ed25519

# Copiază TOT output-ul (de la -----BEGIN ... până la -----END ...)
```

**2. Copiază .env.production pe Server (o singură dată)**
```bash
# De pe local
scp apps/web/.env.production root@65.21.110.105:/opt/expensebot/apps/web/
```

**3. Asigură-te că repo-ul este clonat pe server**
```bash
ssh root@65.21.110.105
cd /opt
git clone https://github.com/AndreiM22/AiExpenseTrackerTelegramBot.git expensebot
cd expensebot
```

### După Setup - Workflow Zilnic

```bash
# 1. Faci modificări în cod (local)
vim apps/web/src/...

# 2. Commit și push
git add .
git commit -m "feat: adaugat feature X"
git push

# 3. GATA! GitHub Actions se ocupă automat de:
#    - Build Docker image
#    - Push la registry
#    - Deploy pe server
#    - Health check
```

**Monitorizare Deployment:**
- Mergi pe GitHub → Actions tab
- Vezi progresul în timp real
- Dacă ceva eșuează, vezi logs acolo

---

## Update Manual Pas cu Pas (dacă nu folosești GitHub Actions)

```bash
# 1. Conectează-te la server
ssh root@65.21.110.105

# 2. Navighează la aplicație
cd /opt/expensebot

# 3. Pull ultimele modificări
git pull

# 4. Verifică ce s-a modificat (opțional)
git log -1 --oneline
git diff HEAD~1

# 5. Stop containerul vechi
docker compose -f docker-compose.prod.yml down

# 6. Rebuild cu noile modificări
docker compose -f docker-compose.prod.yml build

# 7. Pornește noul container
docker compose -f docker-compose.prod.yml up -d

# 8. Verifică că pornește ok
docker compose -f docker-compose.prod.yml logs --tail=50 -f

# 9. Testează
curl http://localhost:3000/api/v1/categories
```

---

## Troubleshooting

### Containerul nu pornește
```bash
# Verifică logs
docker compose -f docker-compose.prod.yml logs

# Verifică status
docker compose -f docker-compose.prod.yml ps

# Rebuilduiește forțat (fără cache)
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Erori la migrations
```bash
# Intră în container
docker compose -f docker-compose.prod.yml exec web sh

# Rulează migrations manual
cd /app/apps/web
npx prisma migrate deploy

# Ieși din container
exit
```

### Reset complet (fresh start)
```bash
cd /opt/expensebot

# Șterge tot (inclusiv baza de date!)
docker compose -f docker-compose.prod.yml down -v

# Pull ultimul cod
git pull

# Start fresh
docker compose -f docker-compose.prod.yml up -d --build
```

### Backup Baza de Date (înainte de update major)
```bash
# Copiază DB-ul
docker compose -f docker-compose.prod.yml cp web:/data/prisma/dev.db ./backup-$(date +%Y%m%d).db

# Sau via volume direct
docker volume inspect telegrambotai_expensebot_data
sudo cp /var/lib/docker/volumes/telegrambotai_expensebot_data/_data/prisma/dev.db ~/backup-$(date +%Y%m%d).db
```

---

## Quick Reference - Cele Mai Folosite Comenzi

```bash
# Update rapid (cu rebuild)
cd /opt/expensebot && git pull && docker compose -f docker-compose.prod.yml up -d --build

# Restart fără rebuild
cd /opt/expensebot && docker compose -f docker-compose.prod.yml restart

# Logs live
cd /opt/expensebot && docker compose -f docker-compose.prod.yml logs -f

# Status
cd /opt/expensebot && docker compose -f docker-compose.prod.yml ps

# Stop tot
cd /opt/expensebot && docker compose -f docker-compose.prod.yml down

# Fresh start (cu rebuild complet)
cd /opt/expensebot && docker compose -f docker-compose.prod.yml down && git pull && docker compose -f docker-compose.prod.yml up -d --build
```

---

## Notițe Importante

🔒 **Securitate:**
- Nu commita NICIODATĂ `.env.production` în git
- Păstrează-l doar pe server și în backup local sigur

📦 **Persistența Datelor:**
- Baza de date este în volume Docker (`expensebot_data`)
- `docker compose down` NU șterge datele
- `docker compose down -v` ȘTERGE datele (folosește doar pentru reset complet)

🔄 **GitHub Actions vs Manual:**
- **GitHub Actions**: Automat, consistent, tracked
- **Manual**: Mai rapid pentru teste, mai flexibil

💡 **Best Practice:**
- Folosește GitHub Actions pentru deployment production
- Manual update doar pentru teste rapide sau debugging
