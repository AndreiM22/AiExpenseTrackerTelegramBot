#!/bin/bash

echo "🤖 Configurare Telegram Bot"
echo "=============================="
echo ""

# Start ngrok in background if not running
if ! pgrep -f "ngrok http 8000" > /dev/null; then
    echo "🌐 Pornesc ngrok..."
    /opt/homebrew/bin/ngrok http 8000 > /tmp/ngrok.log 2>&1 &
    sleep 3
fi

# Get ngrok URL
echo "📡 Obțin URL-ul public..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | /usr/local/bin/python3 -c "import sys, json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Eroare: Nu pot obține URL-ul ngrok"
    echo "Te rog verifică dacă ngrok rulează: http://localhost:4040"
    exit 1
fi

echo "✅ URL public: $NGROK_URL"
echo ""

# Set webhook
WEBHOOK_URL="${NGROK_URL}/api/v1/telegram/webhook"
echo "📮 Setez webhook la: $WEBHOOK_URL"

curl -X POST "http://localhost:8000/api/v1/telegram/webhook/set?webhook_url=${WEBHOOK_URL}" \
  -H "Content-Type: application/json" | /usr/local/bin/python3 -m json.tool

echo ""
echo "✅ Bot-ul Telegram este configurat!"
echo ""
echo "📱 Teste acum bot-ul în Telegram:"
echo "   - Caută: @YourBotName"
echo "   - Trimite: /start"
echo ""
echo "🌐 Monitorizează webhook-urile: http://localhost:4040"
echo "📊 API docs: http://localhost:8000/docs"
echo ""
echo "🛑 Pentru a opri:"
echo "   pkill ngrok"
