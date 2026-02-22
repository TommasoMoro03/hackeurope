"""
Service to analyze experiment results using Claude LLM.
Generates SQL queries, plots, insights, and determines winner.
"""
import json
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from anthropic import Anthropic
from src.config import settings
from src.models.experiment import Experiment
from src.models.segment import Segment
from src.models.event_tracked import EventTracked
from src.models.insight_data import InsightData


class ExperimentAnalysisService:
    """Service to analyze experiment results with LLM."""

    def __init__(self, db: Session):
        self.db = db
        self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-6"

    def analyze_experiment(self, experiment_id: int) -> Dict[str, Any]:
        """
        Main method to analyze an experiment.
        Returns analysis results including plots, insights, and winner.
        """
        # Get experiment with segments
        experiment = self.db.query(Experiment).filter(
            Experiment.id == experiment_id
        ).first()

        if not experiment:
            raise ValueError(f"Experiment {experiment_id} not found")

        # Get all events for this experiment
        events = self.db.query(EventTracked).filter(
            EventTracked.experiment_id == experiment_id
        ).all()

        # Build context for LLM
        context = self._build_analysis_context(experiment, events)

        # Get LLM analysis
        analysis_result = self._call_llm_for_analysis(context, experiment)

        # Determine winner segment
        winner_segment_id = self._determine_winner(analysis_result, experiment)

        # Update experiment with winner
        if winner_segment_id:
            experiment.winning_segment_id = winner_segment_id
            self.db.commit()

        # Return complete analysis
        return {
            "plots": analysis_result.get("plots", []),
            "insights": analysis_result.get("insights", []),
            "winner_segment_id": winner_segment_id,
            "summary": analysis_result.get("summary", ""),
            "raw_data": analysis_result.get("raw_data", {})
        }

    def _build_analysis_context(
        self,
        experiment: Experiment,
        events: List[EventTracked]
    ) -> str:
        """Build comprehensive context for LLM analysis."""

        # Segment information
        segments_info = []
        for segment in experiment.segments:
            segments_info.append({
                "id": segment.id,
                "name": segment.name,
                "instructions": segment.instructions,
                "percentage": segment.percentage
            })

        # Events summary
        events_by_segment = {}
        event_types = set()

        for event in events:
            segment_id = event.segment_id
            if segment_id not in events_by_segment:
                events_by_segment[segment_id] = []
            events_by_segment[segment_id].append(event.event_json)

            # Extract event type
            if isinstance(event.event_json, dict):
                event_types.add(event.event_json.get('event_id', 'unknown'))

        # Build context string
        context = f"""
EXPERIMENT ANALYSIS REQUEST

Experiment: {experiment.name}
Description: {experiment.description}
Status: {experiment.status}
Metrics: {experiment.metrics}

SEGMENTS:
{json.dumps(segments_info, indent=2)}

EVENT TYPES TRACKED:
{', '.join(event_types)}

EVENTS BY SEGMENT:
"""
        for segment_id, segment_events in events_by_segment.items():
            segment = next((s for s in experiment.segments if s.id == segment_id), None)
            segment_name = segment.name if segment else f"Segment {segment_id}"
            context += f"\n{segment_name}: {len(segment_events)} events\n"

        # Sample events for context
        context += "\nSAMPLE EVENTS (first 5 per segment):\n"
        for segment_id, segment_events in events_by_segment.items():
            segment = next((s for s in experiment.segments if s.id == segment_id), None)
            segment_name = segment.name if segment else f"Segment {segment_id}"
            context += f"\n{segment_name}:\n"
            for event in segment_events[:5]:
                context += f"  {json.dumps(event)}\n"

        # Computation logic if available
        if experiment.computation_logic:
            context += f"\nCOMPUTATION LOGIC:\n{experiment.computation_logic}\n"

        return context

    def _call_llm_for_analysis(
        self,
        context: str,
        experiment: Experiment
    ) -> Dict[str, Any]:
        """Call Claude LLM to analyze the experiment."""

        system_prompt = """You are an expert data analyst specializing in A/B test analysis.
Your task is to analyze experiment results and provide actionable insights.

OUTPUT FORMAT (strict JSON only):
{
  "plots": [
    {
      "type": "bar|line|pie",
      "title": "Plot title",
      "data": {
        "labels": ["Label1", "Label2", ...],
        "datasets": [
          {
            "label": "Dataset name",
            "data": [value1, value2, ...],
            "backgroundColor": ["#color1", "#color2", ...]
          }
        ]
      },
      "description": "What this plot shows"
    }
  ],
  "insights": [
    {
      "title": "Insight title",
      "description": "Detailed insight description",
      "severity": "high|medium|low",
      "category": "performance|engagement|conversion|behavior",
      "metrics": {
        "key1": value1,
        "key2": value2
      },
      "recommendation": "What action to take"
    }
  ],
  "summary": "Overall experiment summary in 2-3 sentences",
  "winner_recommendation": {
    "segment_name": "Name of recommended winner",
    "confidence": "high|medium|low",
    "reasoning": "Why this segment won"
  },
  "raw_data": {
    "segment_stats": {
      "segment_name": {
        "total_events": 123,
        "unique_users": 45,
        "event_breakdown": {"event_type": count}
      }
    }
  }
}

ANALYSIS GUIDELINES:
1. Create meaningful visualizations (bar charts for comparisons, line charts for trends, pie charts for distributions)
2. Generate insights that are specific and actionable
3. Calculate key metrics like conversion rates, engagement rates, etc.
4. Identify the winning segment based on the metrics specified
5. Provide confidence levels and reasoning
6. Use colors that are visually distinct for different segments
7. If data is limited, acknowledge it in insights

IMPORTANT:
- Return ONLY valid JSON, no markdown or explanations
- All numeric values should be actual numbers, not strings
- Use realistic color palettes for charts
- Focus on metrics relevant to the experiment goals"""

        user_message = f"""{context}

---
Analyze this experiment data and output the complete JSON analysis.
Focus on comparing segments and identifying clear winners based on the metrics: {experiment.metrics}"""

        # Call Claude
        response = self.anthropic_client.messages.create(
            model=self.model,
            max_tokens=8192,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        )

        # Extract response
        response_text = ""
        for block in response.content:
            if block.type == "text":
                response_text += block.text

        # Parse JSON
        try:
            # Try to extract JSON if wrapped in markdown
            if "```json" in response_text:
                start = response_text.find("```json") + 7
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()
            elif "```" in response_text:
                start = response_text.find("```") + 3
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()

            analysis = json.loads(response_text)
            return analysis
        except json.JSONDecodeError as e:
            # Fallback: return basic analysis
            return {
                "plots": [],
                "insights": [{
                    "title": "Analysis Error",
                    "description": f"Failed to parse LLM response: {str(e)}",
                    "severity": "high",
                    "category": "performance",
                    "metrics": {},
                    "recommendation": "Please try again or contact support"
                }],
                "summary": "Analysis failed due to parsing error",
                "winner_recommendation": None,
                "raw_data": {}
            }

    def _determine_winner(
        self,
        analysis_result: Dict[str, Any],
        experiment: Experiment
    ) -> Optional[int]:
        """Determine winning segment from analysis."""

        winner_rec = analysis_result.get("winner_recommendation")
        if not winner_rec:
            return None

        segment_name = winner_rec.get("segment_name")
        if not segment_name:
            return None

        # Find segment by name
        for segment in experiment.segments:
            if segment.name.lower() == segment_name.lower():
                return segment.id

        return None

    def save_analysis_to_db(
        self,
        experiment_id: int,
        analysis_result: Dict[str, Any]
    ):
        """Save analysis results to InsightData table."""

        # Check if analysis already exists
        existing = self.db.query(InsightData).filter(
            InsightData.experiment_id == experiment_id
        ).first()

        if existing:
            # Update existing
            existing.json_data = analysis_result
            existing.status = "completed"
        else:
            # Create new
            insight = InsightData(
                experiment_id=experiment_id,
                json_data=analysis_result,
                status="completed"
            )
            self.db.add(insight)

        self.db.commit()
