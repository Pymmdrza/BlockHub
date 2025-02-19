# Project variables
PROJECT_NAME := blockhub
DOCKER_COMPOSE := docker-compose
DOCKER_IMAGE := $(PROJECT_NAME):latest
NODE_ENV ?= development

# Colors for terminal output
CYAN := \033[36m
]
GREEN := \033[32m
]
YELLOW := \033[33m
]
RED := \033[31m
]
RESET := \033[0m
]

# Default target
.DEFAULT_GOAL := help

# Help command
.PHONY: help
help:
	@echo "$(CYAN)BlockHub Project Management Commands:$(RESET)"
	@echo "$(GREEN)Basic Commands:$(RESET)"
	@echo "  make install      - Install project dependencies"
	@echo "  make dev         - Start development server"
	@echo "  make build       - Build the project"
	@echo "  make test        - Run tests"
	@echo "  make lint        - Run linting"
	@echo ""
	@echo "$(GREEN)Docker Commands:$(RESET)"
	@echo "  make docker-build   - Build Docker image"
	@echo "  make docker-run     - Run Docker container"
	@echo "  make docker-stop    - Stop Docker container"
	@echo "  make docker-restart - Restart Docker container"
	@echo "  make docker-logs    - View Docker logs"
	@echo ""
	@echo "$(GREEN)Deployment Commands:$(RESET)"
	@echo "  make deploy      - Deploy to production"
	@echo "  make ssl-setup   - Setup SSL certificates"
	@echo ""
	@echo "$(GREEN)Cleanup Commands:$(RESET)"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make docker-clean- Remove Docker artifacts"
	@echo ""
	@echo "$(GREEN)Environment Commands:$(RESET)"
	@echo "  make env-check   - Check environment configuration"
	@echo "  make env-setup   - Setup environment variables"

# Development commands
.PHONY: install
install:
	@echo "$(CYAN)Installing dependencies...$(RESET)"
	npm install

.PHONY: dev
dev:
	@echo "$(CYAN)Starting development server...$(RESET)"
	npm run dev

.PHONY: build
build:
	@echo "$(CYAN)Building project...$(RESET)"
	npm run build

.PHONY: test
test:
	@echo "$(CYAN)Running tests...$(RESET)"
	npm run test

.PHONY: lint
lint:
	@echo "$(CYAN)Running linter...$(RESET)"
	npm run lint

# Docker commands
.PHONY: docker-build
docker-build:
	@echo "$(CYAN)Building Docker image...$(RESET)"
	$(DOCKER_COMPOSE) build

.PHONY: docker-run
docker-run:
	@echo "$(CYAN)Starting Docker container...$(RESET)"
	$(DOCKER_COMPOSE) up -d

.PHONY: docker-stop
docker-stop:
	@echo "$(CYAN)Stopping Docker container...$(RESET)"
	$(DOCKER_COMPOSE) down

.PHONY: docker-restart
docker-restart: docker-stop docker-run
	@echo "$(CYAN)Docker container restarted$(RESET)"

.PHONY: docker-logs
docker-logs:
	@echo "$(CYAN)Viewing Docker logs...$(RESET)"
	$(DOCKER_COMPOSE) logs -f

# Deployment commands
.PHONY: deploy
deploy: env-check docker-build docker-run
	@echo "$(GREEN)Deployment completed successfully$(RESET)"

.PHONY: ssl-setup
ssl-setup:
	@echo "$(CYAN)Setting up SSL certificates...$(RESET)"
	@if [ ! -f .env ]; then \
		echo "$(RED)Error: .env file not found$(RESET)"; \
		exit 1; \
	fi
	@source .env && \
	if [ "$$USE_SSL" = "true" ]; then \
		echo "$(YELLOW)Running SSL setup...$(RESET)"; \
		./scripts/setup_with_ssl.sh; \
	else \
		echo "$(YELLOW)SSL is disabled in .env$(RESET)"; \
	fi

# Cleanup commands
.PHONY: clean
clean:
	@echo "$(CYAN)Cleaning build artifacts...$(RESET)"
	rm -rf dist
	rm -rf node_modules
	rm -rf .cache

.PHONY: docker-clean
docker-clean: docker-stop
	@echo "$(CYAN)Cleaning Docker artifacts...$(RESET)"
	docker system prune -f
	docker volume prune -f

# Environment commands
.PHONY: env-check
env-check:
	@echo "$(CYAN)Checking environment configuration...$(RESET)"
	@if [ ! -f .env ]; then \
		echo "$(RED)Error: .env file not found$(RESET)"; \
		echo "$(YELLOW)Please create .env file from .env.example$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Environment file exists$(RESET)"
	@source .env && \
	if [ -z "$$DOMAIN" ]; then \
		echo "$(RED)Error: DOMAIN not set in .env$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Domain configured: $$DOMAIN$(RESET)"
	@if [ -z "$$ADMIN_EMAIL" ]; then \
		echo "$(RED)Error: ADMIN_EMAIL not set in .env$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Admin email configured: $$ADMIN_EMAIL$(RESET)"

.PHONY: env-setup
env-setup:
	@echo "$(CYAN)Setting up environment variables...$(RESET)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file...$(RESET)"; \
		cp .env.example .env; \
		echo "$(GREEN).env file created. Please update with your settings.$(RESET)"; \
	else \
		echo "$(YELLOW).env file already exists$(RESET)"; \
	fi

# Ensure scripts are executable
.PHONY: ensure-executable
ensure-executable:
	@chmod +x scripts/*.sh

# Initialize project
.PHONY: init
init: ensure-executable install env-setup
	@echo "$(GREEN)Project initialized successfully$(RESET)"

# Production deployment
.PHONY: prod-deploy
prod-deploy: env-check
	@echo "$(CYAN)Deploying to production...$(RESET)"
	@if [ "$$NODE_ENV" != "production" ]; then \
		echo "$(RED)Error: NODE_ENV must be set to production$(RESET)"; \
		exit 1; \
	fi
	make deploy

# Development deployment
.PHONY: dev-deploy
dev-deploy: env-check
	@echo "$(CYAN)Deploying to development...$(RESET)"
	NODE_ENV=development make deploy

# Utility to check Docker installation
.PHONY: check-docker
check-docker:
	@if ! command -v docker > /dev/null; then \
		echo "$(RED)Error: Docker is not installed$(RESET)"; \
		exit 1; \
	fi
	@if ! command -v docker-compose > /dev/null; then \
		echo "$(RED)Error: Docker Compose is not installed$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Docker and Docker Compose are installed$(RESET)"

# Check system requirements
.PHONY: check-requirements
check-requirements: check-docker
	@echo "$(CYAN)Checking system requirements...$(RESET)"
	@if ! command -v node > /dev/null; then \
		echo "$(RED)Error: Node.js is not installed$(RESET)"; \
		exit 1; \
	fi
	@if ! command -v npm > /dev/null; then \
		echo "$(RED)Error: npm is not installed$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)All system requirements are met$(RESET)"
