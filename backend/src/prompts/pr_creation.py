PR_CREATION_PROMPT = """
Implement an A/B/n experiment in this repository. You have tools — use them.

═══════════════════════════════════════════════════════════
EXPERIMENT DEFINITION
═══════════════════════════════════════════════════════════
{{EXPERIMENT_JSON}}

═══════════════════════════════════════════════════════════
TRACKING EVENTS TO IMPLEMENT
═══════════════════════════════════════════════════════════
{{EVENTS_JSON}}

Each event in the list above MUST be fired via fetch() to {{WEBHOOK_URL}} when the corresponding
user action occurs. Use this EXACT payload shape:
{
  "event_id": "<event_id from above>",
  "segment_id": <actual segment id from experiment JSON>,
  "segment_name": "<actual segment name>",
  "experiment_id": <actual experiment id>,
  "project_id": <actual project id>,
  "timestamp": new Date().toISOString(),
  "user_id": "<optional, e.g. from localStorage or null>",
  "metadata": {}
}

═══════════════════════════════════════════════════════════
PREVIEW HASH CONTRACT
═══════════════════════════════════════════════════════════
{{PREVIEW_HASHES_JSON}}

Segments and their preview hashes:
{{PREVIEW_HASHES_MAPPING}}

The app MUST support forced-segment preview via URL hash:
  - On component mount, read: const hash = window.location.hash.slice(1)  // e.g. "test1"
  - If hash matches any segment's preview_hash → force that segment (no random)
  - Otherwise → assign randomly weighted by segment percentages
  - Use the hash values from the experiment JSON exactly (e.g. "test1", "test2")

═══════════════════════════════════════════════════════════
IMPLEMENTATION INSTRUCTIONS
═══════════════════════════════════════════════════════════

STEP 1 — UNDERSTAND THE REPO
  Read the framework-detected key files already in context. Identify:
  - The main page/component that real users land on (e.g. app/page.tsx, src/App.tsx)
  - Where global state / providers live (e.g. app/layout.tsx, src/main.tsx)
  - Existing routing patterns

STEP 2 — CREATE EXPERIMENT FILES
  Create ONE new file per segment variant, e.g.:
    src/experiments/{{EXPERIMENT_NAME}}/ControlVariant.tsx   (segment 1)
    src/experiments/{{EXPERIMENT_NAME}}/VariantB.tsx         (segment 2)
  Each variant file must:
  a) Render the variant UI described in the segment's "instructions"
  b) Import and call trackEvent() for EVERY event in the TRACKING EVENTS list at the right moment
  c) The trackEvent function must POST to {{WEBHOOK_URL}}

  Example variant file structure:
  ---
  const EXPERIMENT_ID = <id>;
  const PROJECT_ID = <project_id>;
  const SEGMENT_ID = <this_segment_id>;
  const SEGMENT_NAME = "<this_segment_name>";
  const WEBHOOK_URL = "{{WEBHOOK_URL}}";

  const trackEvent = (eventId: string, metadata?: Record<string, unknown>) => {
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        segment_id: SEGMENT_ID,
        segment_name: SEGMENT_NAME,
        experiment_id: EXPERIMENT_ID,
        project_id: PROJECT_ID,
        timestamp: new Date().toISOString(),
        user_id: typeof window !== "undefined" ? (localStorage.getItem("userId") ?? null) : null,
        metadata: metadata ?? {},
      }),
    }).catch(() => {});  // fire-and-forget
  };
  ---

STEP 3 — CREATE EXPERIMENT CONTROLLER
  Create src/experiments/{{EXPERIMENT_NAME}}/ExperimentController.tsx (or .jsx/.js if no TS):
  - Reads window.location.hash to detect forced preview segment
  - Otherwise randomly assigns segment weighted by percentages on first load
  - Persists assignment to localStorage so the same user always sees the same variant
  - Renders the correct variant component
  - Fires the first "view" or "impression" event on mount

  Segment assignment logic:
  ---
  const SEGMENTS = [
    { id: <id1>, name: "<name1>", percentage: <pct1>, hash: "<hash1>", Component: ControlVariant },
    { id: <id2>, name: "<name2>", percentage: <pct2>, hash: "<hash2>", Component: VariantB },
  ];
  const STORAGE_KEY = "exp_{{EXPERIMENT_NAME}}_segment";

  function assignSegment() {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const forced = SEGMENTS.find(s => s.hash === hash);
    if (forced) return forced;

    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      const found = SEGMENTS.find(s => s.id === Number(stored));
      if (found) return found;
    }

    let rand = Math.random();
    for (const seg of SEGMENTS) {
      rand -= seg.percentage;
      if (rand <= 0) {
        localStorage.setItem(STORAGE_KEY, String(seg.id));
        return seg;
      }
    }
    localStorage.setItem(STORAGE_KEY, String(SEGMENTS[0].id));
    return SEGMENTS[0];
  }
  ---

STEP 4 — INTEGRATE INTO THE EXISTING APP (CRITICAL)
  Modify the EXISTING main landing page / entry point to render ExperimentController.
  Do NOT create an isolated new route that nobody visits.
  Do NOT remove existing content — wrap or extend it.

  For Next.js App Router: edit app/page.tsx (or the most-visited existing page)
  For React SPA: edit src/App.tsx or the relevant existing page component
  For Next.js Pages: edit pages/index.tsx or relevant existing page

  Add the experiment like this (additive, not replacing):
  ---
  // In the existing page, add near where the experiment targets (e.g. hero section, CTA area):
  import { ExperimentController } from "@/experiments/{{EXPERIMENT_NAME}}/ExperimentController";

  // Then in JSX, place it where the experiment content should appear:
  <ExperimentController />
  ---

  If the page uses SSR/"use client" boundaries, add "use client" to your experiment files.

STEP 5 — WRITE AND COMMIT
  After deciding on all files:
  1. Call write_file for EACH new/modified file with COMPLETE content
  2. Call flush_writes to commit everything at once
  3. Call compare_changes to verify at least {{MIN_CHANGED_FILES}} files changed

STRICT RULES:
  ✗ Never remove existing providers, routes, or imports
  ✗ Never add "use server" to client-side files
  ✗ Never use placeholder IDs — use the REAL IDs from the experiment JSON
  ✗ The final JSON must have "status": "done" (not "files" array)
  ✓ All fetch() to webhook must be fire-and-forget (no await, catch errors silently)
  ✓ Segment assignment must persist to localStorage

FINAL OUTPUT FORMAT (exactly this, after flush_writes + compare_changes):
{"status":"done","commitMessage":"feat: implement {{EXPERIMENT_NAME}} A/B experiment with event tracking","prTitle":"feat: {{EXPERIMENT_NAME}} A/B experiment","prDescription":"Implements {{EXPERIMENT_NAME}} experiment with {{NUM_SEGMENTS}} variants. Events tracked: all events from the spec. Preview via #test1 / #test2 hash.","verificationNotes":"<brief notes on what you changed and where>"}
"""
