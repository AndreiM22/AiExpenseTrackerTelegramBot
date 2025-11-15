#!/bin/bash
set -e

# Quick Deploy to Production Server
# This script pulls latest code and redeploys the application

SERVER_IP="${1:-65.21.110.105}"
SERVER_USER="root"
SERVER_PASS="${SSHPASS:-79aAMJvfMaeV}"

echo "🚀 Quick Deploy to $SERVER_USER@$SERVER_IP"
echo ""

export SSHPASS="$SERVER_PASS"

sshpass -e ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
set -e
cd /opt/expensebot

echo "📥 Pulling latest code..."
git pull origin main

echo "🛑 Stopping containers..."
docker compose -f docker-compose.prod.yml down

echo "🔨 Building new image..."
docker compose -f docker-compose.prod.yml build

echo "▶️  Starting containers..."
docker compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for application..."
sleep 15

echo ""
echo "📊 Container Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "📜 Recent Logs:"
docker compose -f docker-compose.prod.yml logs --tail=20

echo ""
echo "✅ Deploy complete!"
ENDSSH

echo ""
echo "🎉 Application deployed successfully!"
echo "🔗 https://buget.andreim.space"
