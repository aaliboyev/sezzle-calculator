-include .env
export

.PHONY: dev-backend dev-frontend test test-backend test-frontend e2e coverage build run

.env:
	cp .env.example .env

frontend/node_modules: frontend/package.json frontend/package-lock.json
	cd frontend && npm ci
	touch frontend/node_modules

dev-backend: .env
	cd backend && go run .

dev-frontend: .env frontend/node_modules
	cd frontend && npm run dev

test: test-backend test-frontend

test-backend:
	cd backend && go test ./...

test-frontend: frontend/node_modules
	cd frontend && npm test -- --run

e2e: .env frontend/node_modules
	cd frontend && npx playwright test

coverage: frontend/node_modules
	cd backend && go test -coverprofile=coverage.out ./... && go tool cover -func=coverage.out
	cd frontend && npm test -- --run --coverage

build: frontend/node_modules
	cd frontend && npm run build
	rm -rf backend/dist && cp -R frontend/dist backend/dist
	cd backend && go build -tags embed -o bin/calculator .

# .env may not exist at parse time on a fresh clone; source it in the recipe.
run: .env build
	set -a && . ./.env && ./backend/bin/calculator
