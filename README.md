# HackEurope

Analytics & Experimentation Platform with FastAPI backend, React frontend, and webhook listener.

## Services

- **Backend** (port 8000) - FastAPI with auth
- **Frontend** (port 5173) - React dashboard
- **Webhook Listener** (port 8001) - Event ingestion
- **PostgreSQL** (port 5432) - Database

## Run Locally

**Terminal 1 - PostgreSQL:**
```bash
docker run -d \
  --name hackeurope_postgres \
  -e POSTGRES_USER=hackeurope_user \
  -e POSTGRES_PASSWORD=hackeurope_password \
  -e POSTGRES_DB=hackeurope_db \
  -p 5432:5432 \
  postgres:15-alpine
```

**Terminal 2 - Backend:**
```bash
cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000
```

**Terminal 3 - Webhook Listener:**
```bash
cd webhook-listener && source .venv/bin/activate && uvicorn main:app --reload --port 8001
```

**Terminal 4 - Frontend:**
```bash
cd frontend && npm run dev
```

## Database Migrations

```bash
cd backend
source .venv/bin/activate
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Deploy

Push to `main` branch - GitHub Actions builds and pushes to GHCR automatically.

```bash
docker-compose up --build
```
