PR_CREATION_PROMPT = """
Implement an A/B experiment. Changes must be MINIMAL and ADDITIVE ONLY.

EXPERIMENT:
{{EXPERIMENT_JSON}}

TRACKING EVENTS:
{{EVENTS_JSON}}

PREVIEW HASHES:
{{PREVIEW_HASHES_JSON}}

PREVIEW MODE (critical):
Each segment has a preview_hash. On page load, check for ?x=HASH in the URL:
- const hash = new URLSearchParams(window.location.search).get("x");
- If hash matches a segment's preview_hash → force that variant (skip random assignment)
- Otherwise → random assignment based on segment percentages
Use the EXACT preview_hash values from the experiment JSON.

WEBHOOK: {{WEBHOOK_URL}}
POST payload:
{
  "event_id": "event_name",
  "segment_id": <number>,
  "segment_name": "<string>",
  "experiment_id": <number>,
  "project_id": <number>,
  "timestamp": "<ISO string>",
  "user_id": "optional",
  "metadata": {}
}

RULES:
1. ADDITIVE ONLY — create new files, don't remove existing routes/providers/auth
2. If editing App/layout, keep ALL existing providers and routes intact
3. Add ONE minimal entry point (link/button/route) to access the experiment
4. Use direct fetch() for tracking — no elaborate infrastructure
5. Match existing code style and conventions exactly

IMPLEMENTATION:
1. Create component/route files for each segment variant
2. Add preview hash detection + random assignment logic
3. Add tracking fetch() calls with real IDs from the experiment JSON
4. Add one integration point in existing navigation

Use write_file for each file, then flush_writes, then compare_changes.
When done, output JSON:
{"status":"done","commitMessage":"Add {{EXPERIMENT_NAME}} experiment","prTitle":"feat: {{EXPERIMENT_NAME}} A/B test","prDescription":"Minimal additive implementation of {{EXPERIMENT_NAME}} with {{NUM_SEGMENTS}} variants.","verificationNotes":"..."}
"""
