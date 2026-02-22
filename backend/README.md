# Pryo Backend

FastAPI backend for Pryo — A/B testing automation with AI-powered experiment implementation and analysis.

---

## Structure

```
backend/
├── main.py                        # App entry point, lifespan handler
├── migrations/                    # Alembic migrations
│   └── versions/
├── src/
│   ├── config.py                  # Settings (env vars via Pydantic)
│   ├── database.py                # SQLAlchemy engine + session
│   ├── models/
│   │   ├── user.py
│   │   ├── project.py             # GitHub-linked project
│   │   ├── experiment.py          # Core experiment record
│   │   ├── segment.py             # A/B segments
│   │   ├── event_tracked.py       # Raw event storage
│   │   └── insight_data.py        # LLM analysis results
│   ├── routes/
│   │   ├── auth.py                # JWT auth + Google OAuth
│   │   ├── experiments.py         # All experiment endpoints
│   │   ├── github.py              # GitHub OAuth + repo linking
│   │   └── projects.py
│   ├── services/
│   │   ├── github_agent_service_with_tools.py   # AI agent (3-phase PR creation)
│   │   ├── experiment_analysis_service.py        # LLM analysis + plots
│   │   ├── experiment_implementation_service.py  # Orchestrates PR creation
│   │   └── auth_service.py
│   ├── schemas/                   # Pydantic request/response models
│   └── prompts/
│       └── pr_creation.py         # Claude prompt for code generation
└── test_simulate.py               # End-to-end pipeline test
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Current user |

### Experiments
| Method | Path | Description |
|---|---|---|
| GET | `/api/experiments` | List experiments |
| POST | `/api/experiments` | Create + start AI implementation |
| GET | `/api/experiments/{id}` | Get experiment |
| GET | `/api/experiments/{id}/status` | Poll implementation status |
| POST | `/api/experiments/{id}/activate` | Activate after PR merge |
| POST | `/api/experiments/{id}/simulate` | Inject events + run analysis |
| GET | `/api/experiments/{id}/events` | Raw event data |
| POST | `/api/experiments/{id}/finish` | Trigger LLM analysis |
| GET | `/api/experiments/{id}/analysis` | Get charts + insights |
| POST | `/api/experiments/{id}/iterate` | Generate next experiment |
| PATCH | `/api/experiments/{id}/preview-url` | Set preview URL |

### GitHub
| Method | Path | Description |
|---|---|---|
| GET | `/api/github/authorize` | Start OAuth flow |
| GET | `/api/github/callback` | OAuth callback |
| GET | `/api/github/status` | Connection status |

---

## AI Agent (GitHub Agent Service)

The agent runs in three Claude API calls:

**Phase 1 — Plan**
- Tool: `list_files`
- Detects: framework (Next.js/React/Vue), entry point, routing pattern, target files for experiment

**Phase 2 — Read**
- Tool: `read_multiple_files`
- Reads target files, detects code style (indentation, quote style, semicolons, CSS approach, import aliases, export style, TypeScript usage, `"use client"` directives)

**Phase 3 — Write**
- Tools: `write_file`, `flush_writes`, `compare_changes`
- Generates complete segment files matching detected style
- Injects `trackEvent()` calls with preview hash routing (`#test1` / `#test2`)
- Commits via GitHub API and opens PR

---

## Simulate Endpoint

`POST /api/experiments/{id}/simulate`

1. Inserts 120 `EventTracked` rows directly into the database (no external HTTP calls)
2. Assigns users stably to segments weighted by traffic percentage
3. Spreads timestamps over the past 7 days for realistic time series
4. Runs `ExperimentAnalysisService` immediately against those rows
5. Saves results to `InsightData` (plots, insights, winner)
6. Returns `{ sent, event_ids_used, segments, analysis_done }`

Non-destructive — experiment status is not changed.

---

## Analysis Service

`ExperimentAnalysisService.analyze_experiment(id)`

- Reads all `EventTracked` rows for the experiment
- Builds a context string with segment info, event breakdown, and sample events
- Calls Claude (`claude-sonnet-4-6`, max 8192 tokens)
- Returns structured JSON: `{ plots, insights, summary, winner_recommendation, raw_data }`
- Plot types: `bar`, `line`, `pie` (Chart.js compatible)
- Saves to `InsightData` via `save_analysis_to_db()`

---

## Setup

```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # fill in your keys

# Run migrations
python -m alembic upgrade head

# Start server
python -m uvicorn main:app --reload --port 8000
```

Docs available at: http://localhost:8000/docs

---

## Startup Recovery

On startup (`main.py` lifespan handler), any experiments stuck in `implementing` status are automatically marked `failed`. This prevents infinite polling loops after server restarts during background tasks.

---

## Testing

```bash
python test_simulate.py
```

Verifies: event insertion → LLM analysis → InsightData persistence, using a real experiment from the database.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT signing key |
| `ANTHROPIC_API_KEY` | Yes | Claude API (implementation + analysis) |
| `OPENAI_API_KEY` | Yes | OpenAI (event extraction) |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth app |
| `FRONTEND_URL` | Yes | Frontend origin (CORS + OAuth redirect) |
