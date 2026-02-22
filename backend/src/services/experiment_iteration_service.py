"""
Service to generate next experiment iteration based on current results.
Uses LLM to analyze results and suggest follow-up experiments.
"""
import json
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from anthropic import Anthropic
from src.config import settings
from src.models.experiment import Experiment
from src.models.segment import Segment
from src.models.insight_data import InsightData


class ExperimentIterationService:
    """Service to generate next experiment suggestions."""

    def __init__(self, db: Session):
        self.db = db
        self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-6"

    def generate_next_experiment(self, experiment_id: int) -> Dict[str, Any]:
        """
        Generate suggestion for next experiment based on current results.

        Returns:
            Dictionary with rational, experiment plan, and segment suggestions
        """
        # Get experiment with segments and analysis
        experiment = self.db.query(Experiment).filter(
            Experiment.id == experiment_id
        ).first()

        if not experiment:
            raise ValueError(f"Experiment {experiment_id} not found")

        # Get analysis data
        analysis = self.db.query(InsightData).filter(
            InsightData.experiment_id == experiment_id
        ).first()

        # Build context for LLM
        context = self._build_iteration_context(experiment, analysis)

        # Get LLM suggestion
        suggestion = self._call_llm_for_iteration(context, experiment)

        return suggestion

    def _build_iteration_context(
        self,
        experiment: Experiment,
        analysis: Optional[InsightData]
    ) -> str:
        """Build context for iteration suggestion."""

        # Experiment details
        segments_info = []
        for segment in experiment.segments:
            segments_info.append({
                "id": segment.id,
                "name": segment.name,
                "instructions": segment.instructions,
                "percentage": segment.percentage
            })

        context = f"""
CURRENT EXPERIMENT DETAILS

Name: {experiment.name}
Description: {experiment.description}
Status: {experiment.status}
Metrics Tracked: {experiment.metrics}

SEGMENTS TESTED:
{json.dumps(segments_info, indent=2)}

WINNING SEGMENT:
"""

        if experiment.winning_segment:
            context += f"{experiment.winning_segment.name} (ID: {experiment.winning_segment_id})\n"
        else:
            context += "Not determined yet\n"

        # Analysis results
        if analysis and analysis.json_data:
            context += f"\nANALYSIS RESULTS:\n"

            # Summary
            if analysis.json_data.get('summary'):
                context += f"Summary: {analysis.json_data['summary']}\n\n"

            # Winner recommendation
            if analysis.json_data.get('winner_recommendation'):
                winner = analysis.json_data['winner_recommendation']
                context += f"Winner: {winner.get('segment_name')}\n"
                context += f"Confidence: {winner.get('confidence')}\n"
                context += f"Reasoning: {winner.get('reasoning')}\n\n"

            # Key insights
            if analysis.json_data.get('insights'):
                context += "KEY INSIGHTS:\n"
                for insight in analysis.json_data['insights'][:3]:  # Top 3 insights
                    context += f"- [{insight.get('severity').upper()}] {insight.get('title')}: {insight.get('description')}\n"
                context += "\n"

        return context

    def _call_llm_for_iteration(
        self,
        context: str,
        experiment: Experiment
    ) -> Dict[str, Any]:
        """Call Claude LLM to generate next experiment suggestion."""

        system_prompt = """You are an expert A/B testing strategist and product optimizer.
Your task is to analyze completed experiment results and suggest the next logical experiment to run.

OUTPUT FORMAT (strict JSON only):
{
  "rational": "A concise 2-3 sentence explanation of WHY this next experiment makes sense based on the previous results. Connect it directly to insights from the completed experiment.",
  "experiment": {
    "name": "Clear, descriptive experiment name",
    "description": "Brief description of what this experiment will test",
    "metrics": "Comma-separated list of metrics to track (e.g., 'CTR, conversion rate, engagement time')",
    "hypothesis": "What you expect to happen and why"
  },
  "segments": [
    {
      "name": "Segment name (e.g., control, variant-a)",
      "instructions": "Clear instructions for implementing this variant",
      "percentage": 0.5,
      "reasoning": "WHY this variant makes sense based on previous results - this will be shown as a tooltip"
    }
  ],
  "iteration_strategy": "One sentence describing how this builds on the previous experiment"
}

ITERATION PRINCIPLES:
1. BUILD ON WINNERS: If a variant won, the next experiment should explore WHY it won or how to amplify it
2. LEARN FROM INSIGHTS: Use insights from the analysis to inform the next test
3. PROGRESSIVE REFINEMENT: Don't just repeat - go deeper or broader based on learnings
4. CLEAR CONNECTION: Make it obvious how this relates to the previous experiment
5. ACTIONABLE: Segments should have specific, implementable instructions
6. BALANCED: Usually 2-3 segments with clear differentiation

EXAMPLES OF GOOD ITERATIONS:
- If "pizza message" won → Test different pizza-related messages or CTAs
- If higher CTR found → Test what converts those clicks into purchases
- If engagement increased → Test how to increase session duration
- If one color won → Test variations of that color family
- If shorter copy won → Test even shorter vs structured short

IMPORTANT:
- Return ONLY valid JSON, no markdown or explanations
- Reasoning field should be 1-2 sentences max
- Be specific and actionable
- Connect directly to previous results"""

        user_message = f"""{context}

---
Based on the completed experiment results above, suggest the NEXT experiment that should be run.
This should be a logical progression that builds on what we learned.

Output the complete JSON suggestion."""

        # Call Claude
        response = self.anthropic_client.messages.create(
            model=self.model,
            max_tokens=4096,
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

            suggestion = json.loads(response_text)
            return suggestion
        except json.JSONDecodeError as e:
            # Fallback: return basic suggestion
            return {
                "rational": "Based on the previous experiment results, the next logical step is to refine the winning variant.",
                "experiment": {
                    "name": "Follow-up Test",
                    "description": "Refine and improve upon the winning variant from the previous experiment",
                    "metrics": experiment.metrics,
                    "hypothesis": "Further optimization will yield better results"
                },
                "segments": [
                    {
                        "name": "control",
                        "instructions": "Keep the winning variant from previous experiment",
                        "percentage": 0.5,
                        "reasoning": "Baseline from previous winner"
                    },
                    {
                        "name": "enhanced",
                        "instructions": "Enhanced version of the winning variant",
                        "percentage": 0.5,
                        "reasoning": "Building on what worked"
                    }
                ],
                "iteration_strategy": "Iterative refinement based on previous success"
            }
