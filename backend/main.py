from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from src.config import settings
from src.database import engine, Base, get_db
from src.routes import auth, github, experiments

# Import models to ensure they're registered
from src.models import user, project, experiment, segment
from src.models.experiment import Experiment as ExperimentModel

# Rate limiter — keyed by remote IP (works behind most proxies)
limiter = Limiter(key_func=get_remote_address)

# Create database tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup: any experiment stuck in 'implementing' was killed by a previous
    # process restart — mark it failed so the frontend stops polling.
    db = next(get_db())
    try:
        stuck = db.query(ExperimentModel).filter(ExperimentModel.status == "implementing").all()
        if stuck:
            for exp in stuck:
                exp.status = "failed"
                print(f"[startup] Experiment {exp.id} '{exp.name}' was stuck — marked failed")
            db.commit()
    except Exception as e:
        print(f"[startup] Could not recover stuck experiments: {e}")
    finally:
        db.close()
    yield  # app runs here


# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# Attach limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS (allow_credentials=False when origins=["*"] per CORS spec)
cors_origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=("*" not in cors_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(github.router, prefix="/api")
app.include_router(experiments.router, prefix="/api")


@app.get("/")
def root():
    """
    Root endpoint for health check.
    """
    return {
        "message": "Welcome to FastAPI Backend",
        "version": settings.APP_VERSION,
        "status": "healthy"
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
