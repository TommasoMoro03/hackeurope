# Pryo — A/B Testing Automation

> Ship experiments, not spreadsheets.

Deployed: https://hackeurope-frontend-production.up.railway.app/

---

## What is Pryo?

Pryo automates the full A/B experimentation cycle for fast-moving teams:

1. **Describe** — Write a plain-text hypothesis. Pryo structures it into a trackable experiment with segments and metrics.
2. **Implement** — Pryo's AI agent reads your codebase, writes the experiment code, and opens a pull request. No manual integration.
3. **Simulate & Analyze** — Generate realistic event data instantly. Claude LLM analyzes results and produces charts, insights, and a winner recommendation.
4. **Iterate** — Pryo suggests the next best experiment based on what you learned.

---

## Architecture

Three services share one PostgreSQL database:

| Service | Port | Role |
|---|---|---|
| **Backend** | 8000 | FastAPI — auth, experiments, AI agent, analysis |
| **Frontend** | 5173 | React dashboard |
| **PostgreSQL** | 5432 | Single shared database |

> The webhook listener (port 8001) is optional for production event ingestion. For simulation and testing, events are written directly to the main database.

---

## Data Flow

### Experiment Lifecycle

```
User input → POST /api/experiments
                ↓
        status: "started"
                ↓
        GitHubAgentService (Claude AI)
          Phase 1: Plan — detect framework, list files
          Phase 2: Read — read relevant files, detect code style
          Phase 3: Write — generate segment code, open PR
                ↓
        status: "pr_created"  +  pr_url
                ↓
        User merges PR → POST /activate
                ↓
        status: "active"
                ↓
        Events tracked (real or simulated)
                ↓
        POST /finish → ExperimentAnalysisService (Claude LLM)
          - Reads EventTracked rows
          - Generates plots (bar/line/pie) + insights
          - Determines winner segment
          - Saves to InsightData
                ↓
        status: "finished"  →  Results panel
```

### Simulate Flow (non-destructive)

```
POST /api/experiments/{id}/simulate
  ├── Inserts EventTracked rows directly into DB (120 events, stable user→segment assignment)
  ├── Runs ExperimentAnalysisService immediately
  ├── Saves InsightData
  └── Returns { sent, event_ids_used, analysis_done }
Frontend: shows raw events + full results panel (charts, winner, insights)
```

### GitHub AI Agent (Phase Architecture)

```
Phase 1 — Plan  (1 Claude call, list_files tool)
  └─ Identify framework, entry point, routing pattern, target files

Phase 2 — Read  (1 Claude call, read_multiple_files tool)
  └─ Read target files, detect code style (indentation, quotes, CSS approach, exports)

Phase 3 — Write  (1 Claude call, write_file + flush_writes + compare_changes tools)
  └─ Generate experiment files matching detected style
  └─ Inject trackEvent() calls with preview hash routing (#test1 / #test2)

Server-side PR creation
  └─ Create branch, commit files via GitHub API, open PR
```

---

## Key Tables

| Table | Purpose |
|---|---|
| `experiment` | Core record — status, pr_url, preview_url, segments, computation_logic |
| `segment` | A/B segments with traffic percentage and implementation instructions |
| `event_tracked` | Raw events (real or simulated) keyed by experiment + segment |
| `insight_data` | LLM analysis results — plots (Chart.js JSON), insights, winner |

---

## Run Locally

**1. PostgreSQL**
```bash
docker run -d \
  --name pryo_postgres \
  -e POSTGRES_USER=hackeurope_user \
  -e POSTGRES_PASSWORD=hackeurope_password \
  -e POSTGRES_DB=hackeurope_db \
  -p 5432:5432 \
  postgres:15-alpine
```

**2. Backend** (Terminal 1)
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # fill in API keys
python -m alembic upgrade head
python -m uvicorn main:app --reload --port 8000
```

**3. Frontend** (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

> The webhook listener is only needed if you want to receive events from a deployed app. For local development and simulation it is not required.

---

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `ANTHROPIC_API_KEY` | Claude API key (experiment implementation + analysis) |
| `OPENAI_API_KEY` | OpenAI key (used for event extraction) |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `FRONTEND_URL` | Frontend origin for CORS and OAuth redirect |

---

## Database Migrations

```bash
cd backend
# Apply all pending migrations:
python -m alembic upgrade head

# Generate a new migration after model changes:
python -m alembic revision --autogenerate -m "description"
```

---

## Testing

```bash
cd backend
python test_simulate.py   # end-to-end simulate + analysis pipeline
```

The test inserts real events into the DB, runs the LLM analysis, and verifies InsightData is saved correctly.

---

## Deploy

Push to `main` — GitHub Actions builds and pushes Docker images to GHCR automatically.

```bash
docker-compose up --build
```
