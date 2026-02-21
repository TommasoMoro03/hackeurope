from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from src.config import settings
from src.database import get_db, engine, Base
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables (uses same models as backend through shared DB)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Webhook Listener Service",
    version="1.0.0",
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Webhooks can come from anywhere
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "service": "Webhook Listener",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    """Health check for monitoring"""
    return {"status": "healthy"}


@app.post("/webhook/event")
async def receive_event_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives webhook events from user interactions.
    This endpoint is called when users trigger events (clicks, etc.) in your experiments.

    Expected payload:
    {
        "event_type": "click",
        "project_id": 123,
        "experiment_id": 456,
        "user_id": "user-123",
        "metadata": {...},
        "timestamp": "2024-02-21T12:00:00Z"
    }
    """
    try:
        payload = await request.json()
        logger.info(f"Received webhook event: {payload}")

        # TODO: Import and use your Event model from backend
        # For now, just log the event
        # Example:
        # from backend.src.models.event_tracked import EventTracked
        # event = EventTracked(
        #     event_type=payload.get('event_type'),
        #     project_id=payload.get('project_id'),
        #     experiment_id=payload.get('experiment_id'),
        #     user_id=payload.get('user_id'),
        #     metadata=payload.get('metadata'),
        #     timestamp=datetime.fromisoformat(payload.get('timestamp'))
        # )
        # db.add(event)
        # db.commit()

        logger.info(f"Event processed successfully: {payload.get('event_type')}")

        return {
            "status": "success",
            "message": "Event received and stored",
            "event_type": payload.get('event_type')
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }, 500


@app.post("/webhook/click")
async def receive_click_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Specific endpoint for click events.
    Called when users click on elements in your experiments.
    """
    try:
        payload = await request.json()
        logger.info(f"Received click event: {payload}")

        # Process click event
        # Store in database using your Event model

        return {
            "status": "success",
            "message": "Click event received"
        }

    except Exception as e:
        logger.error(f"Error processing click webhook: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }, 500


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
