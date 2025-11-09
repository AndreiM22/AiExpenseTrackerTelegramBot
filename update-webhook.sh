#!/bin/bash

# ========================================
# Update Telegram Webhook
# ========================================

# Load token from .env
if [ -f .env ]; then
    export $(cat .env | grep TELEGRAM_BOT_TOKEN | xargs)
else
    echo "Error: .env not found"
    exit 1
fi

echo "========================================="
echo "  Update Telegram Webhook"
echo "========================================="
echo ""

# Get current webhook
echo "Current webhook status:"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq .
echo ""

# Ask if user wants to delete webhook (for local testing without ngrok)
echo "========================================="
echo "Options:"
echo "1. Delete webhook (for local testing - bot won't receive messages)"
echo "2. Set new webhook URL (requires ngrok or public domain)"
echo "3. Exit"
echo "========================================="
read -p "Choose option (1/2/3): " option

if [ "$option" == "1" ]; then
    echo ""
    echo "Deleting webhook..."
    curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook" | jq .
    echo ""
    echo "✅ Webhook deleted!"
    echo "NOTE: Bot will NOT receive messages until you set a new webhook"

elif [ "$option" == "2" ]; then
    echo ""
    read -p "Enter webhook URL (e.g., https://your-ngrok-url.ngrok.io/api/v1/telegram/webhook): " webhook_url

    if [ -z "$webhook_url" ]; then
        echo "Error: URL cannot be empty"
        exit 1
    fi

    echo ""
    echo "Setting webhook to: $webhook_url"
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
         -d "url=$webhook_url" | jq .

    echo ""
    echo "Verifying webhook..."
    sleep 2
    curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq .

else
    echo "Exiting..."
    exit 0
fi
