# HackEurope

Deployed version: https://hackeurope-frontend-production.up.railway.app/

## Product

### Why

Shipping an MVP is fast. Learning what actually works is not.

The real bottleneck for startups today isn’t building, it’s running structured experiments, extracting insights, and iterating with clarity. Most teams still rely on fragmented tools and manual analysis.

We believe experimentation should be as automatic as deployment.

### What

**Pryo** is an A/B testing automation platform for fast-moving teams.

It helps you launch experiments, collect data, extract insights, and decide what to test next, turning experimentation into a continuous feedback loop.

### How

Pryo automates the entire experimentation cycle:

1. **Generate experiments from plain text**  
   Describe the hypothesis or idea you want to test. Pryo structures it into trackable experiment.

2. **Integrate directly with your codebase**  
   Pryo connects to your repository and automatically opens a pull request with the experiment implementation.

3. **Collect and analyze data automatically**  
   During the experiment, Pryo gathers relevant metrics and structures results in a clear, decision-oriented format.

4. **Close the loop**  
   Once the experiment concludes, Pryo generates actionable insights and suggests the next best experiment to run.

## Technology

### Overview
Our project is made up of three services. Everything is persistent
and saved in our Postres DB.

- **Backend** (port 8000) - FastAPI with auth
- **Frontend** (port 5173) - React dashboard
- **Webhook Listener** (port 8001) - Event ingestion
- **PostgreSQL** (port 5432) - Database

### Technical Workflow

#### Core Experiment Flow

1. **Experiment Creation**
   - User submits experiment details (name, description, segments, metrics) via Frontend
   - Frontend → `POST /api/experiments` → Backend
   - Backend creates experiment record with `status: 'started'`
   - Backend queues PR generation via `GitHubAgentService`
   - Claude generates code implementation and opens PR on user's repository
   - Backend updates experiment `status: 'pr_created'` and stores `pr_url`

2. **Experiment Activation**
   - User merges PR and sets preview URL in Frontend
   - Frontend → `POST /api/experiments/{id}/activate` → Backend
   - Backend updates `status: 'active'` and experiment goes live
   - User's application sends tracking events to Webhook Listener

3. **Event Tracking**
   - User's deployed app → `POST /webhook/event` → Webhook Listener (port 8001)
   - Webhook Listener validates and stores events in PostgreSQL
   - Frontend polls `GET /api/experiments/{id}/events` to display real-time data

4. **Experiment Completion**
   - Frontend → `POST /api/experiments/{id}/finish` → Backend
   - Backend updates `status: 'finishing'` and queues analysis job
   - `AnalysisService` uses Claude to analyze results, generate plots and insights
   - Backend stores analysis and updates `status: 'finished'`
   - Frontend polls `GET /api/experiments/{id}/analysis` to display results

5. **Iteration Loop**
   - Frontend → `POST /api/experiments/{id}/iterate` → Backend
   - `ExperimentIterationService` uses Claude to analyze completed experiment
   - Claude generates next experiment suggestion based on insights
   - Backend returns suggestion (rationale, hypothesis, segments)
   - User accepts → Frontend pre-fills form → New experiment created

#### GitHub Integration

Pryo connects directly to your GitHub repository through OAuth:
- User authenticates via GitHub OAuth (`/api/github/authorize` → GitHub → `/api/github/callback`)
- Backend stores encrypted GitHub token and repository metadata
- On experiment creation, `GitHubAgentService` uses Claude to:
  - Analyze repository structure (framework detection, routing patterns)
  - Generate complete implementation files for all experiment segments
  - Create feature branch and commit changes
  - Open pull request with experiment code
- User reviews PR, merges when ready, experiment goes live

#### Polling Architecture

Pryo uses a polling-based pattern for async operations:
- **Job Creation**: Frontend triggers long-running operation (experiment creation, analysis, iteration)
- **Status Field**: Backend creates record with `status` field (`started`, `implementing`, `pr_created`, `active`, `finishing`, `finished`)
- **Frontend Polling**: React components poll status endpoint every 2 seconds (e.g., `GET /api/experiments/{id}/status`)
- **Progressive Updates**: Backend updates status as job progresses; Frontend shows loading states and step indicators
- **Completion**: When status reaches terminal state (`pr_created`, `finished`), Frontend stops polling and displays results


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
