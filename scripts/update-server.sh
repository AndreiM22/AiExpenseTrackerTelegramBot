#!/bin/bash
set -e

# Quick Update Script pentru Server
# Usage: ./scripts/update-server.sh [server_ip]

SERVER=${1:-"root@65.21.110.105"}
APP_DIR="/opt/expensebot"

echo "🚀 Starting server update..."
echo "Server: $SERVER"
echo "App directory: $APP_DIR"
echo ""

# SSH to server and run update commands
ssh -o StrictHostKeyChecking=no "$SERVER" << 'ENDSSH'
set -e

cd /opt/expensebot

echo "📥 Pulling latest code from GitHub..."
git pull

echo "🛑 Stopping old containers..."
docker compose -f docker-compose.prod.yml down

echo "🔨 Building new Docker image..."
docker compose -f docker-compose.prod.yml build

echo "▶️  Starting new containers..."
docker compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for application to start..."
sleep 10

echo ""
echo "📊 Container Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "📜 Recent Logs:"
docker compose -f docker-compose.prod.yml logs --tail=30

echo ""
echo "✅ Update complete!"
echo ""
echo "🔗 Application should be available at: https://buget.andreim.space"
echo ""
echo "To monitor logs: ssh $SERVER 'cd /opt/expensebot && docker compose -f docker-compose.prod.yml logs -f'"
ENDSSH

echo ""
echo "🎉 Server update finished successfully!"
