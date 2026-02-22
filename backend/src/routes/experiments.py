from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.exc import ProgrammingError
from src.database import get_db
from src.dependencies import get_current_active_user
from src.models.user import User
from src.models.project import Project
from src.models.experiment import Experiment
from src.models.segment import Segment
from src.models.insight_data import InsightData
from src.schemas.experiment import ExperimentCreate, ExperimentResponse, ExperimentPreviewUrlUpdate, SegmentPreviewUrlsUpdate, SegmentPercentagesUpdate, GenerateNameRequest
from src.services.experiment_implementation_service import implement_experiment_sync
from typing import List
import threading
import json
import secrets

router = APIRouter(prefix="/experiments", tags=["Experiments"])


@router.post("/generate-name")
def generate_experiment_name(
    body: GenerateNameRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate a short experiment name (3-4 words) from description and segment instructions.
    """
    description = body.description or ""
    control_instructions = body.control_instructions or ""
    variant_instructions = body.variant_instructions or ""

    context = description
    if control_instructions or variant_instructions:
        context = f"{description}\nControl: {control_instructions}\nVariant: {variant_instructions}".strip()

    if not context.strip():
        return {"name": "New A/B Test"}

    try:
        from src.services.llm_service import get_llm_service
        llm = get_llm_service()
        prompt = f"""Based on this experiment description, suggest a short name (3-4 words max). Be concise and descriptive.

Description:
{context}

Reply with ONLY the name, nothing else. No quotes. Max 4 words."""
        name = llm.call_llm_sync(
            prompt=prompt,
            system_message="You suggest short, descriptive experiment names. Reply with only the name, 3-4 words.",
            temperature=0.7,
            max_tokens=20
        )
        name = (name or "").strip()
        if not name:
            return {"name": "New A/B Test"}
        # Enforce max 4 words
        words = name.split()[:4]
        return {"name": " ".join(words)}
    except Exception:
        return {"name": "New A/B Test"}


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
    # Normalize empty/whitespace to None for preview_url to avoid DB inconsistency
    preview_url = (experiment_data.preview_url or "").strip() or None

    new_experiment = Experiment(
        project_id=project.id,
        name=experiment_data.name,
        description=experiment_data.description,
        percentage=experiment_data.percentage,
        metrics=experiment_data.metrics,
        preview_url=preview_url,
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

    # Fixed preview hashes: #test1 for control, #test2 for variant (user gives base URL)
    segments_sorted = sorted(new_experiment.segments, key=lambda s: s.id)
    segment_preview_hashes = {
        str(seg.id): f"test{i + 1}" for i, seg in enumerate(segments_sorted)
    }
    new_experiment.segment_preview_hashes = json.dumps(segment_preview_hashes)
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

    result = {
        "id": experiment.id,
        "name": experiment.name,
        "status": experiment.status,
        "description": experiment.description or "",
        "metrics": experiment.metrics or "",
        "percentage": experiment.percentage,
        "segments": [
            {
                "id": s.id,
                "name": s.name,
                "instructions": s.instructions or "",
                "percentage": s.percentage,
            }
            for s in sorted(experiment.segments, key=lambda x: x.id)
        ],
    }
    if experiment.pr_url:
        result["pr_url"] = experiment.pr_url
    if experiment.preview_url is not None:
        result["preview_url"] = experiment.preview_url
    if experiment.segment_preview_hashes:
        try:
            result["segment_preview_hashes"] = (
                json.loads(experiment.segment_preview_hashes)
                if isinstance(experiment.segment_preview_hashes, str)
                else experiment.segment_preview_hashes
            )
        except (json.JSONDecodeError, TypeError):
            pass
    if experiment.segment_preview_urls:
        try:
            result["segment_preview_urls"] = (
                json.loads(experiment.segment_preview_urls)
                if isinstance(experiment.segment_preview_urls, str)
                else experiment.segment_preview_urls
            )
        except (json.JSONDecodeError, TypeError):
            pass
    return result


@router.get("/{experiment_id}/events")
def get_experiment_events(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all tracked events for a specific experiment.
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

    # Import EventTracked model
    from src.models.event_tracked import EventTracked

    # Get all events for this experiment
    try:
        events = db.query(EventTracked).filter(
            EventTracked.experiment_id == experiment_id
        ).order_by(EventTracked.created_at.desc()).all()
    except ProgrammingError as e:
        # Graceful fallback if DB schema is behind (missing event_tracked table)
        db.rollback()
        if "event_tracked" in str(e):
            return []
        raise

    # Format response
    return [
        {
            "id": event.id,
            "event_json": event.event_json,
            "created_at": event.created_at.isoformat()
        }
        for event in events
    ]


@router.patch("/{experiment_id}/preview-url", response_model=ExperimentResponse)
def update_experiment_preview_url(
    experiment_id: int,
    body: ExperimentPreviewUrlUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update the project (preview) URL for an experiment.
    """
    project = db.query(Project).filter(Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No project linked"
        )

    experiment = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.project_id == project.id
    ).first()

    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )

    # Normalize empty/whitespace to None to avoid DB inconsistency
    experiment.preview_url = (body.preview_url or "").strip() or None
    db.commit()
    db.refresh(experiment)
    return experiment


@router.patch("/{experiment_id}/segment-preview-urls", response_model=ExperimentResponse)
def update_segment_preview_urls(
    experiment_id: int,
    body: SegmentPreviewUrlsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update per-segment preview URLs. Each segment (A/B) can have its own full URL.
    No auto hashing - user sets the domain for each variant.
    """
    project = db.query(Project).filter(Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No project linked"
        )

    experiment = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.project_id == project.id
    ).first()

    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )

    # Normalize: strip URLs
    normalized = {}
    for seg_id, url in (body.segment_preview_urls or {}).items():
        normalized[str(seg_id)] = (url or "").strip()

    experiment.segment_preview_urls = json.dumps(normalized) if normalized else None
    db.commit()
    db.refresh(experiment)
    return experiment


@router.patch("/{experiment_id}/segment-percentages", response_model=ExperimentResponse)
def update_segment_percentages(
    experiment_id: int,
    body: SegmentPercentagesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update traffic split percentages for experiment segments.
    """
    project = db.query(Project).filter(Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No project linked"
        )

    experiment = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.project_id == project.id
    ).first()

    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )

    total = sum(s.percentage for s in body.segments)
    if not (0.99 <= total <= 1.01):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Segment percentages must sum to 1.0 (100%). Current sum: {total}"
        )

    segment_ids = {s.id for s in experiment.segments}
    for update in body.segments:
        if update.id not in segment_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Segment {update.id} does not belong to this experiment"
            )
        seg = db.query(Segment).filter(
            Segment.id == update.id,
            Segment.experiment_id == experiment_id
        ).first()
        if seg:
            seg.percentage = update.percentage

    db.commit()
    db.refresh(experiment)
    return experiment


@router.post("/{experiment_id}/activate")
def activate_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Activate an experiment after PR has been merged.
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

    # Update status to active
    experiment.status = "active"
    db.commit()

    return {
        "id": experiment.id,
        "name": experiment.name,
        "status": experiment.status,
        "message": "Experiment activated successfully"
    }


@router.post("/{experiment_id}/finish")
def finish_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Finish an experiment and trigger analysis job.
    Analyzes results with LLM, generates plots and insights.
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

    # Update status to finishing
    experiment.status = "finishing"
    db.commit()

    # Launch background job to analyze experiment
    def finish_job():
        from src.database import SessionLocal
        from src.services.experiment_analysis_service import ExperimentAnalysisService

        db_bg = SessionLocal()
        try:
            # Create analysis service
            analysis_service = ExperimentAnalysisService(db_bg)

            # Analyze experiment
            analysis_result = analysis_service.analyze_experiment(experiment_id)

            # Save analysis to database
            analysis_service.save_analysis_to_db(experiment_id, analysis_result)

            # Update experiment status to finished
            exp = db_bg.query(Experiment).filter(Experiment.id == experiment_id).first()
            if exp:
                exp.status = "finished"
                db_bg.commit()
                db_bg.refresh(exp)

        except Exception as e:
            # On error, rollback failed transaction before any new queries
            db_bg.rollback()
            import traceback
            print(f"Error analyzing experiment {experiment_id}: {str(e)}")
            traceback.print_exc()
            try:
                exp = db_bg.query(Experiment).filter(Experiment.id == experiment_id).first()
                if exp:
                    exp.status = "failed"
                    db_bg.commit()
            except Exception as inner:
                print(f"Failed to set failed status: {inner}")
                db_bg.rollback()
        finally:
            db_bg.close()

    import threading
    thread = threading.Thread(target=finish_job)
    thread.daemon = True
    thread.start()

    return {
        "id": experiment.id,
        "name": experiment.name,
        "status": experiment.status,
        "message": "Experiment finishing process started"
    }


@router.get("/{experiment_id}/analysis")
def get_experiment_analysis(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get analysis results for a finished experiment.
    Returns plots, insights, and winner information.
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

    # Get analysis data
    analysis = db.query(InsightData).filter(
        InsightData.experiment_id == experiment_id
    ).first()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found. Experiment may not be finished yet."
        )

    # Return analysis with winner info
    result = {
        "id": analysis.id,
        "experiment_id": analysis.experiment_id,
        "status": analysis.status,
        "created_at": analysis.created_at.isoformat(),
        "analysis": analysis.json_data,
        "winning_segment_id": experiment.winning_segment_id
    }

    # Add winning segment details if available
    if experiment.winning_segment_id:
        winning_segment = db.query(Segment).filter(
            Segment.id == experiment.winning_segment_id
        ).first()
        if winning_segment:
            result["winning_segment"] = {
                "id": winning_segment.id,
                "name": winning_segment.name,
                "instructions": winning_segment.instructions
            }

    return result


@router.post("/{experiment_id}/iterate")
def generate_next_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate suggestion for next experiment based on current results.
    Uses LLM to analyze results and propose a follow-up experiment.
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

    # Verify experiment is finished
    if experiment.status != "finished":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only iterate on finished experiments"
        )

    # Generate iteration suggestion
    from src.services.experiment_iteration_service import ExperimentIterationService

    try:
        iteration_service = ExperimentIterationService(db)
        suggestion = iteration_service.generate_next_experiment(experiment_id)

        return {
            "success": True,
            "suggestion": suggestion,
            "based_on_experiment_id": experiment_id,
            "based_on_experiment_name": experiment.name
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate iteration: {str(e)}"
        )
