#!/bin/bash

# ========================================
# Telegram Bot Test Script
# ========================================

echo "========================================"
echo "  Telegram Bot Configuration Test"
echo "========================================"
echo ""

# Load .env
if [ -f .env ]; then
    export $(cat .env | grep TELEGRAM_BOT_TOKEN | xargs)
else
    echo "Error: .env not found"
    exit 1
fi

if [ "$TELEGRAM_BOT_TOKEN" == "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ_dummy_token" ]; then
    echo "⚠️  WARNING: You are using a DUMMY token!"
    echo ""
    echo "To use the real Telegram Bot:"
    echo "1. Open Telegram and search: @BotFather"
    echo "2. Send: /newbot"
    echo "3. Follow instructions to get your token"
    echo "4. Edit .env and replace TELEGRAM_BOT_TOKEN with your real token"
    echo "5. Run: docker compose restart app"
    echo ""
    exit 1
fi

echo "Bot Token: ${TELEGRAM_BOT_TOKEN:0:20}..."
echo ""

# Test bot token
echo "Testing bot token..."
RESPONSE=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe")
echo "$RESPONSE" | jq .

if echo "$RESPONSE" | grep -q '"ok":true'; then
    BOT_USERNAME=$(echo "$RESPONSE" | jq -r '.result.username')
    echo ""
    echo "✅ Bot token is valid!"
    echo "Bot username: @${BOT_USERNAME}"
    echo ""

    # Check webhook status
    echo "Checking webhook status..."
    WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo")
    echo "$WEBHOOK_INFO" | jq .

    WEBHOOK_URL=$(echo "$WEBHOOK_INFO" | jq -r '.result.url')

    if [ "$WEBHOOK_URL" == "" ] || [ "$WEBHOOK_URL" == "null" ]; then
        echo ""
        echo "⚠️  No webhook configured!"
        echo ""
        echo "For LOCAL testing, you have 2 options:"
        echo ""
        echo "Option 1: Use ngrok (recommended for testing)"
        echo "  1. Install ngrok: brew install ngrok"
        echo "  2. Run: ngrok http 8000"
        echo "  3. Copy the HTTPS URL (ex: https://abc123.ngrok.io)"
        echo "  4. Set webhook:"
        echo "     curl -X POST \"https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook\" \\"
        echo "          -d \"url=https://YOUR_NGROK_URL/api/v1/telegram/webhook\""
        echo ""
        echo "Option 2: Deploy to server (for production)"
        echo "  1. Deploy using: ./setup-ssl.sh && make prod"
        echo "  2. Set webhook:"
        echo "     curl -X POST \"https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook\" \\"
        echo "          -d \"url=https://api.yourdomain.com/api/v1/telegram/webhook\""
        echo ""
    else
        echo ""
        echo "✅ Webhook is configured!"
        echo "Webhook URL: $WEBHOOK_URL"
        echo ""
        echo "You can now use your bot:"
        echo "1. Open Telegram"
        echo "2. Search for: @${BOT_USERNAME}"
        echo "3. Send: /start"
        echo ""
    fi
else
    echo ""
    echo "❌ Bot token is INVALID!"
    echo "Please check your token in .env file"
    echo ""
fi
