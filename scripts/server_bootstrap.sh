#!/usr/bin/env bash

set -euo pipefail

APP_DIR=${APP_DIR:-/opt/expensebot}
REPO_URL=${REPO_URL:-}

function info() { echo -e "\033[1;32m[INFO]\033[0m $*"; }
function warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
function err()  { echo -e "\033[1;31m[ERR ]\033[0m $*" >&2; }

if [[ $EUID -ne 0 ]]; then
  err "Rulează scriptul cu sudo sau ca root."
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  info "Instalez git..."
  apt-get update && apt-get install -y git
fi

if ! command -v docker >/dev/null 2>&1; then
  info "Instalez Docker + plugin compose..."
  apt-get update && apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list >/dev/null
  apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker && systemctl start docker
fi

read -rp "Introdu URL-ul Git (ex: git@github.com:user/TelegramBotAI.git): " input_repo
REPO_URL=${REPO_URL:-$input_repo}
if [[ -z "$REPO_URL" ]]; then
  err "URL-ul repo este obligatoriu."
  exit 1
fi

if [[ -d "$APP_DIR/.git" ]]; then
  info "Repo găsit în $APP_DIR, fac pull..."
  git -C "$APP_DIR" pull
else
  info "Clonare repo în $APP_DIR ..."
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi

ENV_FILE="$APP_DIR/apps/web/.env.production"
if [[ ! -f "$ENV_FILE" ]]; then
  DOMAIN_DEFAULT=${DOMAIN:-"https://$(hostname -I | awk '{print $1}')"}
  read -rp "Domeniu (ex: https://example.com): " domain
  domain=${domain:-$DOMAIN_DEFAULT}
  read -rp "NEXTAUTH_SECRET (random, îl poți genera cu openssl rand -base64 32): " secret
  read -rp "Admin email (default admin@example.com): " admin_email
  read -rp "Admin parolă (default admin123): " admin_pass
  read -rp "GROQ_API_KEY (opțional): " groq_key
  read -rp "Telegram bot token (opțional): " telegram_token
  read -rp "Telegram webhook secret (opțional): " telegram_secret

  cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_APP_URL=${domain}
NEXT_PUBLIC_API_URL=${domain}
API_BASE_URL=${domain}
DATABASE_URL="file:/data/prisma/dev.db"
GROQ_API_KEY=${groq_key}
GROQ_MANUAL_MODEL=llama-3.3-70b-versatile
TELEGRAM_BOT_TOKEN=${telegram_token}
TELEGRAM_WEBHOOK_SECRET=${telegram_secret}
ENCRYPTION_KEY=$(openssl rand -hex 16)
WEBHOOK_VERIFICATION_TOKEN=
NEXTAUTH_SECRET=${secret}
ADMIN_EMAIL=${admin_email:-admin@example.com}
ADMIN_PASSWORD=${admin_pass:-admin123}
ENABLE_TELEGRAM_BOT=false
ENABLE_WEB_UI=true
EOF
  info "Fișierul $ENV_FILE a fost creat."
else
  warn "$ENV_FILE există deja. Îl păstrez."
fi

cd "$APP_DIR"
info "Pornez aplicația cu docker compose..."
docker compose -f docker-compose.prod.yml up -d --build

info "Gata! Aplicația ar trebui să fie accesibilă pe portul 3000 la ${domain}."
