-include .env
export

.PHONY: dev-backend dev-frontend test test-backend test-frontend e2e coverage build run

dev-backend:
	cd backend && go run .

dev-frontend:
	cd frontend && npm run dev

test: test-backend test-frontend

test-backend:
	cd backend && go test ./...

test-frontend:
	cd frontend && npm test -- --run

e2e:
	cd frontend && npx playwright test

coverage:
	cd backend && go test -coverprofile=coverage.out ./... && go tool cover -func=coverage.out
	cd frontend && npm test -- --run --coverage

build:
	cd frontend && npm run build
	rm -rf backend/dist && cp -R frontend/dist backend/dist
	cd backend && go build -tags embed -o bin/calculator .

run: build
	./backend/bin/calculator
