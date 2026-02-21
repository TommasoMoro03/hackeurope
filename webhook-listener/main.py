from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from src.config import settings
from src.database import get_db, engine, Base
from src.models.event_tracked import EventTracked  # Import model to register it with Base
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables (uses same models as backend through shared DB)

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
        "event_id": "event_name",
        "segment_id": 123,
        "segment_name": "control",
        "experiment_id": 456,
        "project_id": 789,
        "timestamp": "2024-02-21T12:00:00Z",
        "user_id": "user-123",
        "metadata": {...}
    }
    """
    try:
        payload = await request.json()
        logger.info(f"Received webhook event: {payload}")

        # Create event record
        event = EventTracked(
            project_id=payload.get('project_id'),
            experiment_id=payload.get('experiment_id'),
            segment_id=payload.get('segment_id'),
            event_json=payload  # Store entire payload as JSONB
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        logger.info(f"Event stored successfully: {payload.get('event_id')} (ID: {event.id})")

        return {
            "status": "success",
            "message": "Event received and stored",
            "event_id": payload.get('event_id'),
            "stored_id": event.id
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        import traceback
        traceback.print_exc()
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
