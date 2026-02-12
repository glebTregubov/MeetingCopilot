PYTHON ?= python3
BACKEND_DIR := backend
FRONTEND_DIR := frontend
BACKEND_VENV := $(BACKEND_DIR)/.venv
BACKEND_PYTHON := $(BACKEND_VENV)/bin/python
BACKEND_PIP := $(BACKEND_VENV)/bin/pip

.PHONY: setup setup-backend setup-frontend dev dev-backend dev-frontend test test-backend test-frontend lint lint-backend lint-frontend format format-frontend

setup: setup-backend setup-frontend

setup-backend:
	cd $(BACKEND_DIR) && $(PYTHON) -m venv .venv
	$(BACKEND_PIP) install -r $(BACKEND_DIR)/requirements-dev.txt

setup-frontend:
	cd $(FRONTEND_DIR) && npm install

dev:
	@echo "Run backend and frontend in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

dev-backend:
	cd $(BACKEND_DIR) && . .venv/bin/activate && uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd $(FRONTEND_DIR) && npm run dev -- --host 0.0.0.0 --port 5173

test: test-backend test-frontend

test-backend:
	cd $(BACKEND_DIR) && . .venv/bin/activate && pytest -q

test-frontend:
	cd $(FRONTEND_DIR) && npm run test

lint: lint-backend lint-frontend

lint-backend:
	cd $(BACKEND_DIR) && . .venv/bin/activate && ruff check src tests

lint-frontend:
	cd $(FRONTEND_DIR) && npm run lint

format: format-frontend

format-frontend:
	cd $(FRONTEND_DIR) && npx prettier --write .
