#!/bin/bash
set -e

# Telegram Webhook Setup Script
# This script configures the Telegram bot webhook to point to your server

# Load environment variables
if [ -f "apps/web/.env.production" ]; then
  export $(grep -v '^#' apps/web/.env.production | xargs)
elif [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check required environment variables
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "❌ Error: TELEGRAM_BOT_TOKEN not set"
  echo "Please set it in .env or apps/web/.env.production"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_APP_URL not set"
  echo "Please set it to your public domain (e.g., https://buget.andreim.space)"
  exit 1
fi

WEBHOOK_URL="${NEXT_PUBLIC_APP_URL}/api/telegram/webhook"
SECRET_TOKEN="${TELEGRAM_WEBHOOK_SECRET:-}"

echo "🤖 Setting up Telegram Bot Webhook"
echo "Bot Token: ${TELEGRAM_BOT_TOKEN:0:20}..."
echo "Webhook URL: $WEBHOOK_URL"

# Set webhook
if [ -n "$SECRET_TOKEN" ]; then
  echo "Secret Token: ${SECRET_TOKEN:0:10}..."
  RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
    -d "url=${WEBHOOK_URL}" \
    -d "secret_token=${SECRET_TOKEN}" \
    -d "allowed_updates=[\"message\",\"edited_message\"]")
else
  echo "⚠️  Warning: No TELEGRAM_WEBHOOK_SECRET set (less secure)"
  RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
    -d "url=${WEBHOOK_URL}" \
    -d "allowed_updates=[\"message\",\"edited_message\"]")
fi

echo "Response: $RESPONSE"

# Check if successful
if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "✅ Webhook configured successfully!"

  # Get webhook info
  echo ""
  echo "📊 Current Webhook Info:"
  curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq '.'
else
  echo "❌ Failed to set webhook"
  echo "$RESPONSE" | jq '.'
  exit 1
fi

echo ""
echo "🎉 Setup complete! Your bot is now ready to receive messages."
echo "Send a message to your bot on Telegram to test it!"
