# Ghid rapid: Deploy Expense Bot AI pe server (Docker) – Română

## 1. Pregătește fișierul de mediu pentru producție

1. În repo, copiază `.env.production.example`:
   ```bash
   cd /opt/expensebot    # sau directorul în care clonezi repo-ul
   cp apps/web/.env.production.example apps/web/.env.production
   ```
2. Editează `apps/web/.env.production` și completează valorile:
   - `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_API_URL` / `API_BASE_URL` = domeniul tău (fără `/api`).
   - `DATABASE_URL="file:/data/prisma/dev.db"` pentru a stoca baza SQLite în volumul Docker.
   - `NEXTAUTH_SECRET` = un string random generat din `openssl rand -base64 32`.
   - `GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, etc., dacă vrei și Groq/Telegram live.

## 2. Deploy manual pe server cu Docker Compose

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker && sudo systemctl start docker

# Clonează repo-ul (sau fă pull dacă există deja)
cd /opt
sudo git clone <repo> expensebot
cd /opt/expensebot

# Pornește serviciul
sudo docker compose -f docker-compose.prod.yml up -d
```

- Containerul expune portul `3000` (modifică variabila `PORT` dacă ai nevoie).
- Baza SQLite este salvată în volumul `expensebot_data` (mapat la `/data` în container).

### Actualizare manuală a aplicației
```bash
cd /opt/expensebot
sudo git pull
sudo docker compose -f docker-compose.prod.yml up -d --build
```

## 3. CI/CD automat (GitHub Actions + GHCR)

1. În GitHub, mergi la **Settings > Secrets and variables > Actions** și adaugă:
   - `DEPLOY_HOST` (adresa serverului, ex. `65.21.xx.xx`)
   - `DEPLOY_USER` (de ex. `root` sau un user cu permisiuni Docker)
   - `DEPLOY_KEY` (cheia privată SSH, format PEM)

2. Pe server, asigură-te că `/opt/expensebot` exista și conține repo-ul.

3. CI/CD-ul este definit în `.github/workflows/deploy.yml`. La fiecare push pe `main`:
   - construiește imaginea Docker și o urcă în `ghcr.io/<org>/<repo>:latest`
   - (opțional) se conectează via SSH la server și rulează:
     ```bash
     cd /opt/expensebot
     docker pull ghcr.io/<org>/<repo>:latest
     IMAGE_NAME=ghcr.io/<org>/<repo>:latest docker compose -f docker-compose.prod.yml down
     IMAGE_NAME=ghcr.io/<org>/<repo>:latest docker compose -f docker-compose.prod.yml up -d
     ```

## 4. Note utile
- **Trafic HTTPS**: setează un reverse proxy (Nginx/Caddy) în fața containerului și expune portul 3000 intern.
- **Webhook Telegram**: după ce aplicația e online, configurează BotFather cu `https://domeniu/api/telegram/webhook` și `secret_token` = `TELEGRAM_WEBHOOK_SECRET`.
- **Groq**: dacă cheia lipsește, aplicația folosește fallback heuristics. Pentru producție, setează `GROQ_API_KEY` + `GROQ_MANUAL_MODEL`.
- **Reset DB**: poți șterge volumul `docker volume rm expensebot_data`, dar vei pierde toate datele.

### Verificări rapide după deploy
```bash
curl http://localhost:3000/api/v1/expenses | jq         # test API intern
curl http://localhost:3000/health || echo "health fail" # dacă expui un health endpoint
sudo docker compose -f docker-compose.prod.yml logs -f   # loguri live
```

> Dacă ai întrebări sau vezi erori, rulează `sudo docker compose ... logs -f` și urmărește output-ul. EOF