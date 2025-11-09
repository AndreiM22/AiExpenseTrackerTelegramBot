#!/bin/bash

# ========================================
# Quick Start Script - Local Development
# ========================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "  🚀 Expense Bot AI - Quick Start"
echo "========================================"
echo ""

# Check if Docker is running
echo -n "Checking Docker... "
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗${NC}"
    echo ""
    echo -e "${YELLOW}Docker is not running!${NC}"
    echo ""
    echo "Starting Docker Desktop..."
    open -a Docker

    echo "Waiting for Docker to start (this may take 30-60 seconds)..."
    for i in {1..30}; do
        if docker info > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Docker is ready!${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done

    if ! docker info > /dev/null 2>&1; then
        echo -e "\n${RED}Error: Docker failed to start${NC}"
        echo "Please start Docker Desktop manually and try again."
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC}"
fi

echo ""

# Check if .env exists
echo -n "Checking .env file... "
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠${NC}"
    echo ""
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env created${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Edit .env and add your API keys!${NC}"
    echo ""
else
    echo -e "${GREEN}✓${NC}"
fi

echo ""

# Build and start
echo -e "${BLUE}Building and starting Docker containers...${NC}"
echo "This may take 5-10 minutes on first run (downloading dependencies)..."
echo ""

docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo -e "${GREEN}✓ All containers started successfully!${NC}"
    echo "========================================"
    echo ""

    # Wait for services to be ready
    echo "Waiting for services to be ready..."
    sleep 5

    # Check health
    echo ""
    echo "Testing API..."
    HEALTH=$(curl -s http://localhost:8000/api/v1/health 2>/dev/null || echo "")

    if [ -n "$HEALTH" ]; then
        echo -e "${GREEN}✓ API is responding!${NC}"
        echo ""
        echo "========================================"
        echo "  📡 Your API is running!"
        echo "========================================"
        echo ""
        echo "🌐 API Endpoints:"
        echo "   • Root:       http://localhost:8000/"
        echo "   • Health:     http://localhost:8000/api/v1/health"
        echo "   • API Docs:   http://localhost:8000/docs"
        echo "   • ReDoc:      http://localhost:8000/redoc"
        echo ""
        echo "📊 Database:"
        echo "   • PostgreSQL: localhost:5432"
        echo "   • User:       expenseuser"
        echo "   • Database:   expensebot"
        echo ""
        echo "💾 Redis:"
        echo "   • Host:       localhost:6379"
        echo ""
        echo "📝 Useful Commands:"
        echo "   • View logs:  docker-compose logs -f"
        echo "   • Stop:       docker-compose down"
        echo "   • Restart:    docker-compose restart"
        echo "   • Shell:      docker-compose exec app bash"
        echo ""
        echo "🔧 Makefile Commands:"
        echo "   • make logs   - View logs"
        echo "   • make down   - Stop all"
        echo "   • make shell  - Enter container"
        echo "   • make test   - Run tests"
        echo ""

        # Open docs in browser
        echo -n "Open API docs in browser? [y/N] "
        read -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open http://localhost:8000/docs
        fi

    else
        echo -e "${YELLOW}⚠ API not responding yet${NC}"
        echo "Check logs: docker-compose logs -f app"
    fi

else
    echo ""
    echo -e "${RED}✗ Failed to start containers${NC}"
    echo ""
    echo "Check logs for errors:"
    echo "   docker-compose logs"
    exit 1
fi

echo ""
echo "Happy coding! 🚀"
echo ""
