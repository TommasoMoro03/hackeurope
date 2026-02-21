import json
import re
from src.services.llm_service import get_llm_service
from src.prompts.experiment_creation import EVENTS_EXTRACTION_PROMPT
from typing import Dict, Optional


class EventsExtractionService:
    """
    Service to extract tracking events and computation logic from experiment metrics.
    """

    @staticmethod
    def extract_events_and_logic(metrics: str, experiment_json: Dict) -> Dict:
        """
        Extract tracking events and computation logic from metrics description.

        Args:
            metrics: The metrics description from the experiment
            experiment_json: Full experiment data as dictionary

        Returns:
            Dictionary with events and computation_logic
        """
        llm = get_llm_service()

        # Build prompt from template
        prompt = EVENTS_EXTRACTION_PROMPT
        prompt = prompt.replace("{{METRICS}}", metrics)
        prompt = prompt.replace("{{EXPERIMENT_JSON}}", json.dumps(experiment_json, indent=2))

        # Call LLM
        response = llm.call_llm_sync(
            prompt=prompt,
            system_message="You are an analytics architect. Return only valid JSON, no markdown.",
            temperature=0.3,  # Lower temperature for more consistent output
            json_mode=True  # Force JSON response
        )

        # Parse response
        try:
            parsed = json.loads(response)
            return parsed
        except json.JSONDecodeError:
            # Try to extract JSON if there's extra text
            match = re.search(r'\{[\s\S]*\}', response)
            if match:
                return json.loads(match.group(0))
            else:
                raise Exception("Failed to parse events extraction response")
