PR_CREATION_PROMPT = """
You are implementing an A/B/n test experiment. Your changes must be MINIMAL and ADDITIVE ONLY.

EXPERIMENT DEFINITION:
{{EXPERIMENT_JSON}}

TRACKING EVENTS:
{{EVENTS_JSON}}

PREVIEW HASHES (for #test1, #test2 URL override):
{{PREVIEW_HASHES_JSON}}

CRITICAL - Preview mode: Each segment has a preview_hash (e.g. "test1", "test2"). When the user visits with a hash fragment (e.g. https://myapp.com#test1 or https://myapp.com#test2), the app MUST detect this and force-render that segment's variant. Implement client-side logic:
1. On load, parse window.location.hash (e.g. hash.slice(1) to get "test1" or "test2")
2. If the hash matches a segment's preview_hash, render that segment's variant and use that segment_id for all tracking
3. Otherwise, use normal random assignment based on segment percentages
Each segment in the experiment JSON includes "preview_hash". Use these exact values. Left/preview1 = #test1, right/preview2 = #test2.

WEBHOOK: {{WEBHOOK_URL}}
Payload structure:
{
  "event_id": "event_name",
  "segment_id": number,
  "segment_name": "string",
  "experiment_id": number,
  "project_id": number,
  "timestamp": "ISO string",
  "user_id": "optional",
  "metadata": {}
}

STRICT RULES:
1. ADDITIVE ONLY: Create new files. Do NOT remove or replace existing providers, routes, or components.
2. PRESERVE CONTEXT: If editing App.tsx or root layout, ensure ALL existing providers (Auth, Theme, etc.) and routes remain intact.
3. MINIMAL INTEGRATION: Add experiment access via ONE new route or ONE small change to an existing page (e.g., a single link/button).
4. NO STRUCTURAL CHANGES: Do not rewrite root App, remove auth, or modify protected routes.
5. SIMPLE TRACKING: Use direct fetch() calls to {{WEBHOOK_URL}} - no elaborate infrastructure.

VERIFICATION CHECKLIST:
[ ] No existing providers removed from App or root layout
[ ] No existing routes removed
[ ] Pages using useAuth() or similar hooks still have required providers above them
[ ] New experiment components are purely additive

IMPLEMENTATION:
1. Create new route/component files for each segment variant
2. Add ONE minimal entry point (link, button, or route) to access experiment
3. Add fetch() calls for tracking events using actual IDs from {{EXPERIMENT_JSON}}

EXAMPLE (Next.js) - include preview hash check:
// On app/experiment layout or provider: detect #test1 or #test2 and force segment
const hashVal = typeof window !== 'undefined' ? window.location.hash.slice(1) : null;
const forcedSegment = segments.find(s => s.preview_hash === hashVal);
// If forcedSegment, render that variant; else use random assignment.

// NEW FILE: app/experiment-name/control/page.tsx
export default function ControlVariant() {
  const trackEvent = (eventId: string) => {
    fetch('{{WEBHOOK_URL}}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        segment_id: ACTUAL_SEGMENT_ID,
        segment_name: 'control',
        experiment_id: ACTUAL_EXPERIMENT_ID,
        project_id: ACTUAL_PROJECT_ID,
        timestamp: new Date().toISOString()
      })
    });
  };

  return <button onClick={() => trackEvent('button_click')}>Click Me</button>;
}

// SMALL UPDATE to ONE existing file (e.g., app/page.tsx):
// Add: <Link href="/experiment-name/control">Try Experiment</Link>

OUTPUT (JSON only, no markdown):
{
  "files": [
    {
      "path": "path/to/file",
      "content": "complete file content",
      "action": "create or update"
    }
  ],
  "commitMessage": "Add {{EXPERIMENT_NAME}} experiment",
  "prTitle": "feat: {{EXPERIMENT_NAME}} A/B test",
  "prDescription": "Minimal additive implementation of {{EXPERIMENT_NAME}} with {{NUM_SEGMENTS}} variants. No existing functionality removed."
}
"""