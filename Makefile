.DEFAULT_GOAL := help
SHELL := /usr/bin/env bash

# ─── Colors ───────────────────────────────────────────────────────────────────
RED    := \033[0;31m
GREEN  := \033[0;32m
YELLOW := \033[1;33m
CYAN   := \033[0;36m
RESET  := \033[0m

# ─── Variables ────────────────────────────────────────────────────────────────
BACKEND_DIR  := backend
FRONTEND_DIR := frontend

.PHONY: help install dev build clean test lint \
        backend/install backend/dev backend/build backend/start backend/test backend/lint \
        backend/migration/run backend/migration/revert backend/migration/generate \
        frontend/install frontend/dev frontend/build frontend/preview frontend/test frontend/lint \
        db/start db/stop db/shell db/create db/migrate db/seed \
        docker/up docker/down docker/build docker/logs \
        ci

# ─── Help ─────────────────────────────────────────────────────────────────────
help: ## Show available commands
	@echo ""
	@echo "  Car Rental Service — Build Commands"
	@echo ""
	@grep -E '^[a-zA-Z_/%-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-35s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ─── Top-Level Commands ────────────────────────────────────────────────────────
install: backend/install frontend/install ## Install all dependencies

dev: ## Start backend and frontend in dev mode (requires tmux or run in separate terminals)
	@echo "$(YELLOW)Run in separate terminals:$(RESET)"
	@echo "  make backend/dev"
	@echo "  make frontend/dev"

build: backend/build frontend/build ## Build both backend and frontend for production

clean: ## Remove all build artifacts and node_modules
	rm -rf $(BACKEND_DIR)/dist $(BACKEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/node_modules

test: backend/test frontend/test ## Run all tests

lint: backend/lint frontend/lint ## Lint all code

ci: install lint test build ## Run CI pipeline (install → lint → test → build)

# ─── Backend ──────────────────────────────────────────────────────────────────
backend/install: ## Install backend dependencies
	@echo "$(CYAN)Installing backend dependencies...$(RESET)"
	cd $(BACKEND_DIR) && npm install

backend/dev: ## Start backend in development mode with hot-reload
	@echo "$(CYAN)Starting backend dev server...$(RESET)"
	cd $(BACKEND_DIR) && npm run start:dev

backend/build: ## Build backend for production
	@echo "$(CYAN)Building backend...$(RESET)"
	cd $(BACKEND_DIR) && npm run build

backend/start: ## Start backend production server
	cd $(BACKEND_DIR) && npm run start:prod

backend/test: ## Run backend unit tests
	@echo "$(CYAN)Running backend tests...$(RESET)"
	cd $(BACKEND_DIR) && npm test

backend/test/e2e: ## Run backend E2E tests
	cd $(BACKEND_DIR) && npm run test:e2e

backend/test/cov: ## Run backend tests with coverage
	cd $(BACKEND_DIR) && npm run test:cov

backend/lint: ## Lint backend code
	@echo "$(CYAN)Linting backend...$(RESET)"
	cd $(BACKEND_DIR) && npm run lint

backend/lint/fix: ## Auto-fix backend lint errors
	cd $(BACKEND_DIR) && npm run lint -- --fix

# ─── Database Migrations ──────────────────────────────────────────────────────
backend/migration/run: ## Run all pending TypeORM migrations
	@echo "$(CYAN)Running database migrations...$(RESET)"
	cd $(BACKEND_DIR) && npm run migration:run

backend/migration/revert: ## Revert the last TypeORM migration
	@echo "$(YELLOW)Reverting last migration...$(RESET)"
	cd $(BACKEND_DIR) && npm run migration:revert

backend/migration/generate: ## Generate a migration from entity changes (usage: make backend/migration/generate NAME=MyMigration)
	@if [ -z "$(NAME)" ]; then \
		echo "$(RED)Error: NAME is required. Usage: make backend/migration/generate NAME=MyMigration$(RESET)"; \
		exit 1; \
	fi
	cd $(BACKEND_DIR) && npm run migration:generate -- src/migrations/$(NAME)

backend/migration/create: ## Create an empty migration (usage: make backend/migration/create NAME=MyMigration)
	@if [ -z "$(NAME)" ]; then \
		echo "$(RED)Error: NAME is required. Usage: make backend/migration/create NAME=MyMigration$(RESET)"; \
		exit 1; \
	fi
	cd $(BACKEND_DIR) && npm run migration:create -- src/migrations/$(NAME)

backend/seed: ## Run database seeds
	cd $(BACKEND_DIR) && npm run seed

# ─── Frontend ─────────────────────────────────────────────────────────────────
frontend/install: ## Install frontend dependencies
	@echo "$(CYAN)Installing frontend dependencies...$(RESET)"
	cd $(FRONTEND_DIR) && npm install

frontend/dev: ## Start frontend dev server (Vite)
	@echo "$(CYAN)Starting frontend dev server...$(RESET)"
	cd $(FRONTEND_DIR) && npm run dev

frontend/build: ## Build frontend for production
	@echo "$(CYAN)Building frontend...$(RESET)"
	cd $(FRONTEND_DIR) && npm run build

frontend/preview: ## Preview production build locally
	cd $(FRONTEND_DIR) && npm run preview

frontend/test: ## Run frontend tests
	@echo "$(CYAN)Running frontend tests...$(RESET)"
	cd $(FRONTEND_DIR) && npm test

frontend/lint: ## Lint frontend code
	@echo "$(CYAN)Linting frontend...$(RESET)"
	cd $(FRONTEND_DIR) && npm run lint

frontend/lint/fix: ## Auto-fix frontend lint errors
	cd $(FRONTEND_DIR) && npm run lint -- --fix

# ─── Database ─────────────────────────────────────────────────────────────────
db/start: ## Start PostgreSQL with PostGIS via Docker
	docker run -d \
		--name car_rental_postgres \
		-e POSTGRES_DB=car_rental \
		-e POSTGRES_USER=postgres \
		-e POSTGRES_PASSWORD=password \
		-p 5432:5432 \
		postgis/postgis:14-3.3
	@echo "$(GREEN)PostgreSQL started at localhost:5432$(RESET)"

db/stop: ## Stop and remove local PostgreSQL container
	docker stop car_rental_postgres && docker rm car_rental_postgres

db/shell: ## Open psql shell to database
	docker exec -it car_rental_postgres psql -U postgres -d car_rental

db/create: ## Create the database and enable PostGIS
	psql -U postgres -c "CREATE DATABASE car_rental;" 2>/dev/null || true
	psql -U postgres -d car_rental -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# ─── Docker ───────────────────────────────────────────────────────────────────
docker/build: ## Build all Docker images
	@echo "$(CYAN)Building Docker images...$(RESET)"
	docker-compose build

docker/up: ## Start all Docker services (postgres, backend, frontend)
	@echo "$(CYAN)Starting Docker Compose services...$(RESET)"
	docker-compose up -d
	@echo "$(GREEN)Services started:$(RESET)"
	@echo "  Backend  → http://localhost:3000"
	@echo "  Frontend → http://localhost:5173"
	@echo "  Database → localhost:5432"

docker/down: ## Stop all Docker services and remove containers
	docker-compose down

docker/down/v: ## Stop all Docker services and remove volumes (clears database!)
	@echo "$(RED)Warning: This will DELETE all database data!$(RESET)"
	docker-compose down -v

docker/logs: ## Tail logs from all Docker services
	docker-compose logs -f

docker/logs/backend: ## Tail backend logs
	docker-compose logs -f backend

docker/ps: ## Show running Docker containers
	docker-compose ps

# ─── Utilities ────────────────────────────────────────────────────────────────
check/env: ## Verify required environment variables are set
	@echo "$(CYAN)Checking environment variables...$(RESET)"
	@test -f $(BACKEND_DIR)/.env || (echo "$(RED)Missing: $(BACKEND_DIR)/.env$(RESET)"; exit 1)
	@test -f $(FRONTEND_DIR)/.env || (echo "$(RED)Missing: $(FRONTEND_DIR)/.env$(RESET)"; exit 1)
	@echo "$(GREEN)Environment files present.$(RESET)"
