PR_CREATION_PROMPT = """
You are implementing an A/B/n test experiment in a web application.

EXPERIMENT DEFINITION:
{{EXPERIMENT_JSON}}

TRACKING EVENTS:
{{EVENTS_JSON}}

WEBHOOK ENDPOINT: http://localhost:9000/webhook/event
The webhook endpoint expects this payload structure:
{
  "event_id": "event_name",
  "segment_id": number,  // Must be the segment ID (integer), not name
  "segment_name": "segment_name",
  "experiment_id": number,
  "project_id": number,
  "timestamp": "ISO string",
  "user_id": "optional",
  "metadata": {}
}

CRITICAL REQUIREMENTS - MINIMIZE CHANGES:
1. Create ONLY new route files for each segment variant (do NOT modify existing routes)
2. Add ONLY ONE minimal link/button to ONE existing navigation file to make variants accessible
3. Use the SMALLEST possible change to integrate - a single line or button is ideal
4. For tracking: implement a simple fetch() call to the webhook endpoint
5. DO NOT create elaborate tracking infrastructure - just direct fetch() calls
6. DO NOT modify multiple existing files - touch as few files as possible

TASK:
1. Create separate route files for each segment (e.g., app/experiment-name/variant-a/page.tsx)
2. Add ONE minimal navigation link in ONE existing file (navbar, menu, or page)
3. In each route, add simple fetch() calls for events to http://localhost:9000/webhook/event
4. Keep implementation MINIMAL - avoid over-engineering

EXAMPLE (Next.js):
// New file: app/button-test/control/page.tsx
// IMPORTANT: Replace SEGMENT_ID, EXPERIMENT_ID, PROJECT_ID with actual integer values from {{EXPERIMENT_JSON}}
export default function ControlVariant() {
  const trackEvent = (event_id: string) => {
    fetch('http://localhost:9000/webhook/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id,
        segment_id: SEGMENT_ID,  // Use actual segment ID (integer)
        segment_name: 'control',
        experiment_id: EXPERIMENT_ID,  // Use actual experiment ID (integer)
        project_id: PROJECT_ID,  // Use actual project ID (integer)
        timestamp: new Date().toISOString(),
        user_id: null,
        metadata: {}
      })
    });
  };

  return (
    <div>
      <button onClick={() => trackEvent('button_view')}>Control Button</button>
    </div>
  );
}

// Update ONE existing file (e.g., app/page.tsx) - add ONE line:
<Link href="/button-test/control">View Experiment</Link>

OUTPUT FORMAT (JSON only, no markdown):
{
  "files": [
    {
      "path": "path/to/file",
      "content": "complete file content",
      "action": "create or update"
    }
  ],
  "commitMessage": "Add {{EXPERIMENT_NAME}} experiment variants",
  "prTitle": "feat: {{EXPERIMENT_NAME}} A/B test",
  "prDescription": "Minimal implementation of {{EXPERIMENT_NAME}} with {{NUM_SEGMENTS}} variants. Webhooks point to localhost:9000/webhook/event."
}
"""
