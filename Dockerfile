FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend .
RUN npm run build

FROM golang:1.25-alpine AS backend
WORKDIR /app
COPY backend/go.mod ./
COPY backend .
COPY --from=frontend /app/dist ./dist
RUN CGO_ENABLED=0 go build -tags embed -o /calculator .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=backend /calculator /calculator
ENV BACKEND_PORT=5700
EXPOSE 5700
ENTRYPOINT ["/calculator"]
