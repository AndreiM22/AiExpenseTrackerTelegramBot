#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "  Docker Setup Verification Script"
echo "========================================="
echo ""

# Check if Docker is installed
echo -n "Checking Docker installation... "
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
    docker --version
else
    echo -e "${RED}✗${NC}"
    echo "Docker is not installed!"
    exit 1
fi

echo ""

# Check if Docker Compose is installed
echo -n "Checking Docker Compose installation... "
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
    docker-compose --version
else
    echo -e "${RED}✗${NC}"
    echo "Docker Compose is not installed!"
    exit 1
fi

echo ""

# Check if Dockerfile exists
echo -n "Checking Dockerfile... "
if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "Dockerfile not found!"
    exit 1
fi

echo ""

# Check if .dockerignore exists
echo -n "Checking .dockerignore... "
if [ -f ".dockerignore" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} .dockerignore not found (optional)"
fi

echo ""

# Check if docker-compose.yml exists
echo -n "Checking docker-compose.yml... "
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "docker-compose.yml not found!"
    exit 1
fi

echo ""

# Check if requirements.txt exists
echo -n "Checking requirements.txt... "
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✓${NC}"
    echo "   Dependencies found: $(wc -l < requirements.txt) packages"
else
    echo -e "${RED}✗${NC}"
    echo "requirements.txt not found!"
    exit 1
fi

echo ""

# Check if .env file exists
echo -n "Checking .env file... "
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} .env file not found"
    echo "   Create .env file with required variables:"
    echo "   - GROQAPIKEY"
    echo "   - telegramToken"
    echo "   - DATABASE_URL"
    echo "   - ENCRYPTION_KEY"
fi

echo ""

# Validate Dockerfile syntax
echo -n "Validating Dockerfile syntax... "
if docker build --target base -t test-validate . --no-cache &> /tmp/docker_validate.log; then
    echo -e "${GREEN}✓${NC}"
    rm /tmp/docker_validate.log
else
    echo -e "${RED}✗${NC}"
    echo "Dockerfile has syntax errors. Check /tmp/docker_validate.log"
    exit 1
fi

echo ""

# Check Docker daemon
echo -n "Checking Docker daemon... "
if docker info &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "Docker daemon is not running!"
    exit 1
fi

echo ""
echo "========================================="
echo -e "${GREEN}All checks passed!${NC}"
echo "========================================="
echo ""
echo "You can now build and run the project:"
echo ""
echo "Development:"
echo "  docker-compose up --build"
echo ""
echo "Production:"
echo "  docker-compose -f docker-compose.prod.yml up --build -d"
echo ""
