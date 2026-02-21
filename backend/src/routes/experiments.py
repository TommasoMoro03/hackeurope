from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from src.database import get_db
from src.dependencies import get_current_active_user
from src.models.user import User
from src.models.project import Project
from src.models.experiment import Experiment
from src.models.segment import Segment
from src.schemas.experiment import ExperimentCreate, ExperimentResponse
from src.services.experiment_implementation_service import implement_experiment_sync
from typing import List
import threading

router = APIRouter(prefix="/experiments", tags=["Experiments"])


@router.post("", response_model=ExperimentResponse)
def create_experiment(
    experiment_data: ExperimentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new experiment with segments.
    """
    # Get user's project
    project = db.query(Project).filter(Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No project linked. Please link a GitHub repository first."
        )

    # Validate that segment percentages sum to 1
    total_percentage = sum(segment.percentage for segment in experiment_data.segments)
    if not (0.99 <= total_percentage <= 1.01):  # Allow small floating point error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Segment percentages must sum to 1.0 (100%). Current sum: {total_percentage}"
        )

    # Create experiment with "started" status
    new_experiment = Experiment(
        project_id=project.id,
        name=experiment_data.name,
        description=experiment_data.description,
        percentage=experiment_data.percentage,
        metrics=experiment_data.metrics,
        status="started"
    )
    db.add(new_experiment)
    db.flush()  # Get the experiment ID

    # Create segments
    for segment_data in experiment_data.segments:
        new_segment = Segment(
            experiment_id=new_experiment.id,
            name=segment_data.name,
            instructions=segment_data.instructions,
            percentage=segment_data.percentage
        )
        db.add(new_segment)

    db.commit()
    db.refresh(new_experiment)

    # Launch background task to implement the experiment
    # Using thread to avoid blocking the response
    experiment_id = new_experiment.id

    def run_implementation():
        # Create a new database session for the background thread
        from src.database import SessionLocal
        db_bg = SessionLocal()
        try:
            implement_experiment_sync(experiment_id, db_bg)
        finally:
            db_bg.close()

    thread = threading.Thread(target=run_implementation)
    thread.daemon = True
    thread.start()

    return new_experiment


@router.get("", response_model=List[ExperimentResponse])
def get_experiments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all experiments for the user's project.
    Sorted by most recent first.
    """
    # Get user's project
    project = db.query(Project).filter(Project.user_id == current_user.id).first()
    if not project:
        return []

    # Get all experiments for this project, sorted by created_at DESC
    experiments = db.query(Experiment).filter(
        Experiment.project_id == project.id
    ).order_by(Experiment.created_at.desc()).all()

    return experiments


@router.get("/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific experiment by ID.
    """
    # Get user's project
    project = db.query(Project).filter(Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No project linked"
        )

    # Get experiment
    experiment = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.project_id == project.id
    ).first()

    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )

    return experiment


@router.get("/{experiment_id}/status")
def get_experiment_status(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the status of a specific experiment (for polling).
    Returns a lightweight response with just the status.
    """
    # Get user's project
    project = db.query(Project).filter(Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No project linked"
        )

    # Get experiment
    experiment = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.project_id == project.id
    ).first()

    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )

    return {
        "id": experiment.id,
        "name": experiment.name,
        "status": experiment.status
    }
