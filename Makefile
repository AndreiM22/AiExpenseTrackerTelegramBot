.PHONY: help build up down restart logs shell test clean verify dev prod

# Default target
help:
	@echo "========================================="
	@echo "  Expense Bot AI - Docker Commands"
	@echo "========================================="
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Start development mode"
	@echo "  make build       - Build development containers"
	@echo "  make up          - Start containers"
	@echo "  make down        - Stop containers"
	@echo "  make restart     - Restart containers"
	@echo "  make logs        - View logs (follow)"
	@echo "  make shell       - Enter app container"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run tests"
	@echo "  make lint        - Run linters"
	@echo "  make format      - Format code"
	@echo ""
	@echo "Production:"
	@echo "  make prod        - Start production mode"
	@echo "  make prod-build  - Build production containers"
	@echo "  make prod-down   - Stop production"
	@echo "  make prod-logs   - View production logs"
	@echo "  make prod-ps     - Production container status"
	@echo ""
	@echo "SSL/HTTPS:"
	@echo "  make setup-ssl   - Setup SSL certificate (Let's Encrypt)"
	@echo "  make ssl-renew   - Manually renew SSL certificate"
	@echo "  make ssl-check   - Check SSL certificate expiration"
	@echo ""
	@echo "Utilities:"
	@echo "  make verify      - Verify Docker setup"
	@echo "  make clean       - Clean containers and volumes"
	@echo "  make ps          - Show running containers"
	@echo "  make stats       - Show container stats"
	@echo ""

# Development commands
dev: build up

build:
	@echo "Building development containers..."
	docker-compose build

up:
	@echo "Starting development containers..."
	docker-compose up -d
	@echo "✓ Containers started!"
	@echo "API: http://localhost:8000"
	@echo "Docs: http://localhost:8000/docs"

down:
	@echo "Stopping containers..."
	docker-compose down
	@echo "✓ Containers stopped!"

restart:
	@echo "Restarting containers..."
	docker-compose restart
	@echo "✓ Containers restarted!"

logs:
	@echo "Following logs (Ctrl+C to exit)..."
	docker-compose logs -f

logs-app:
	@echo "Following app logs (Ctrl+C to exit)..."
	docker-compose logs -f app

shell:
	@echo "Entering app container..."
	docker-compose exec app bash

db-shell:
	@echo "Entering database..."
	docker-compose exec db psql -U expenseuser -d expensebot

redis-shell:
	@echo "Entering Redis CLI..."
	docker-compose exec redis redis-cli

# Testing commands
test:
	@echo "Running tests..."
	docker-compose exec app pytest -v

test-cov:
	@echo "Running tests with coverage..."
	docker-compose exec app pytest --cov=app --cov-report=html --cov-report=term

lint:
	@echo "Running linters..."
	docker-compose exec app flake8 app/
	docker-compose exec app mypy app/

format:
	@echo "Formatting code with black..."
	docker-compose exec app black app/

# Production commands
prod: prod-build prod-up

prod-build:
	@echo "Building production containers..."
	docker-compose -f docker-compose.prod.yml build

prod-up:
	@echo "Starting production containers..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✓ Production containers started!"

prod-down:
	@echo "Stopping production containers..."
	docker-compose -f docker-compose.prod.yml down
	@echo "✓ Production containers stopped!"

prod-logs:
	@echo "Following production logs (Ctrl+C to exit)..."
	docker-compose -f docker-compose.prod.yml logs -f

prod-restart:
	@echo "Restarting production containers..."
	docker-compose -f docker-compose.prod.yml restart
	@echo "✓ Production containers restarted!"

prod-ps:
	@echo "Production container status:"
	docker-compose -f docker-compose.prod.yml ps

# SSL Setup
setup-ssl:
	@echo "Setting up SSL certificate..."
	./setup-ssl.sh

ssl-renew:
	@echo "Renewing SSL certificate..."
	docker-compose -f docker-compose.prod.yml exec certbot certbot renew
	docker-compose -f docker-compose.prod.yml restart nginx

ssl-check:
	@echo "Checking SSL certificate..."
	@echo | openssl s_client -servername $${DOMAIN:-localhost} -connect $${DOMAIN:-localhost}:443 2>/dev/null | openssl x509 -noout -dates

# Utility commands
verify:
	@echo "Verifying Docker setup..."
	./verify_docker.sh

ps:
	@echo "Running containers:"
	docker-compose ps

stats:
	@echo "Container resource usage:"
	docker stats --no-stream

health:
	@echo "Checking application health..."
	@curl -f http://localhost:8000/health || echo "Health check failed!"

clean:
	@echo "Cleaning containers and volumes..."
	@read -p "This will delete all data. Continue? [y/N] " confirm; \
	if [ "$$confirm" = "y" ]; then \
		docker-compose down -v; \
		echo "✓ Cleaned!"; \
	else \
		echo "Cancelled."; \
	fi

clean-all:
	@echo "Deep clean (removes images too)..."
	@read -p "This will delete everything. Continue? [y/N] " confirm; \
	if [ "$$confirm" = "y" ]; then \
		docker-compose down -v --rmi all; \
		echo "✓ Deep cleaned!"; \
	else \
		echo "Cancelled."; \
	fi

# Database migrations
migrate:
	@echo "Running database migrations..."
	docker-compose exec app alembic upgrade head

migrate-create:
	@read -p "Enter migration message: " msg; \
	docker-compose exec app alembic revision --autogenerate -m "$$msg"

migrate-down:
	@echo "Rolling back last migration..."
	docker-compose exec app alembic downgrade -1

# Quick rebuilds
rebuild:
	@echo "Rebuilding without cache..."
	docker-compose build --no-cache
	docker-compose up -d
	@echo "✓ Rebuild complete!"

rebuild-app:
	@echo "Rebuilding app only..."
	docker-compose up -d --build app
	@echo "✓ App rebuilt!"

# Monitoring
top:
	@echo "Container processes:"
	docker-compose top

inspect:
	@echo "Container details:"
	docker-compose exec app env

volumes:
	@echo "Docker volumes:"
	docker volume ls | grep expense-bot

# Development helpers
install:
	@echo "Installing new Python package..."
	@read -p "Package name: " pkg; \
	docker-compose exec app pip install $$pkg; \
	docker-compose exec app pip freeze > requirements.txt
	@echo "✓ Package installed and requirements.txt updated!"

ipython:
	@echo "Starting IPython shell..."
	docker-compose exec app ipython

# Backup & Restore
backup-db:
	@echo "Backing up database..."
	docker-compose exec -T db pg_dump -U expenseuser expensebot > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✓ Database backed up!"

restore-db:
	@read -p "Enter backup file path: " file; \
	docker-compose exec -T db psql -U expenseuser expensebot < $$file
	@echo "✓ Database restored!"
