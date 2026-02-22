import asyncio
import time
import json
import secrets
from sqlalchemy.orm import Session
from src.models.experiment import Experiment
from src.models.project import Project
from src.services.llm_service import get_llm_service
from src.services.events_extraction_service import EventsExtractionService
from src.services.github_agent_service_with_tools import GitHubAgentService


async def implement_experiment_async(experiment_id: int, db: Session):
    """
    Background task to implement an experiment.
    This simulates the LLM implementation process.

    Args:
        experiment_id: The ID of the experiment to implement
        db: Database session
    """
    try:
        # Get the experiment
        experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
        if not experiment:
            return

        # Update status to implementing
        experiment.status = "implementing"
        db.commit()

        # Simulate LLM implementation process
        # In production, this would:
        # 1. Generate code for each segment based on instructions
        # 2. Create pull request or branches
        # 3. Set up tracking infrastructure
        # 4. Configure deployment

        # For now, simulate with sleep
        await asyncio.sleep(10)  # Simulate 10 seconds of work

        # Mock LLM call (uncomment when ready to use real LLM)
        # llm = get_llm_service()
        # response = await llm.call_llm(
        #     prompt=f"Implement experiment: {experiment.name}",
        #     system_message="You are an expert software engineer implementing A/B tests"
        # )

        # Update status to active when complete
        experiment.status = "active"
        db.commit()

    except Exception as e:
        # Update status to failed if something goes wrong
        experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
        if experiment:
            experiment.status = "failed"
            db.commit()
        print(f"Error implementing experiment {experiment_id}: {str(e)}")


def implement_experiment_sync(experiment_id: int, db: Session):
    """
    Synchronous version for two-step LLM process:
    1. Extract events and computation logic from metrics
    2. Create PR with Anthropic agent

    Args:
        experiment_id: The ID of the experiment to implement
        db: Database session
    """
    try:
        # Get the experiment with project
        experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
        if not experiment:
            return

        project = db.query(Project).filter(Project.id == experiment.project_id).first()
        if not project:
            experiment.status = "failed"
            db.commit()
            return

        # Update status to implementing
        experiment.status = "implementing"
        db.commit()

        # STEP 1: Extract events and computation logic from metrics
        print(f"Step 1: Extracting events from metrics for experiment {experiment_id}")

        # Use existing preview hashes (test1, test2 at creation) or generate if missing
        if experiment.segment_preview_hashes:
            segment_preview_hashes = json.loads(experiment.segment_preview_hashes)
        else:
            segments_sorted = sorted(experiment.segments, key=lambda s: s.id)
            segment_preview_hashes = {
                str(seg.id): f"test{i + 1}" for i, seg in enumerate(segments_sorted)
            }
            experiment.segment_preview_hashes = json.dumps(segment_preview_hashes)
            db.commit()

        experiment_json = {
            "id": experiment.id,
            "project_id": project.id,
            "name": experiment.name,
            "description": experiment.description,
            "percentage": experiment.percentage,
            "metrics": experiment.metrics,
            "preview_url": experiment.preview_url or None,
            "segment_preview_hashes": segment_preview_hashes,
            "segments": [
                {
                    "id": seg.id,
                    "name": seg.name,
                    "instructions": seg.instructions,
                    "percentage": seg.percentage,
                    "preview_hash": segment_preview_hashes.get(str(seg.id)),
                }
                for seg in experiment.segments
            ]
        }

        events_data = EventsExtractionService.extract_events_and_logic(
            metrics=experiment.metrics or "",
            experiment_json=experiment_json
        )

        # Store full events_data (events list + computation logic) so simulation & analysis both work
        experiment.computation_logic = json.dumps(events_data)
        db.commit()

        print(f"Events extracted: {json.dumps(events_data, indent=2)}")

        # STEP 2: Create PR using Anthropic agent
        print(f"Step 2: Creating PR with Anthropic agent for experiment {experiment_id}")

        github_agent = GitHubAgentService(github_token=project.github_access_token)

        pr_result = github_agent.create_experiment_pr(
            owner=project.github_owner,
            repo_name=project.name,
            experiment_data=experiment_json,
            events_data=events_data
        )

        print(f"PR created: {pr_result['pr_url']}")

        # Store PR URL and set status so user can review before merging
        experiment.pr_url = pr_result["pr_url"]
        experiment.status = "pr_created"
        db.commit()

    except Exception as e:
        # Update status to failed if something goes wrong
        experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
        if experiment:
            experiment.status = "failed"
            db.commit()
        print(f"Error implementing experiment {experiment_id}: {str(e)}")
        import traceback
        traceback.print_exc()
