// Experiment: Button Sign-in Color Change (ID: 11)
// Project ID: 9

export const EXPERIMENT_ID = 11;
export const PROJECT_ID = 9;

export interface Segment {
  id: number;
  name: string;
  preview_hash: string;
  percentage: number;
}

export const SEGMENTS: Segment[] = [
  { id: 21, name: 'A', preview_hash: 'Iak0--8g2mI', percentage: 0.5 },
  { id: 22, name: 'B', preview_hash: 'uNq52jms0xw', percentage: 0.5 },
];

const STORAGE_KEY = 'exp_11_segment';

export function resolveSegment(): Segment {
  // Check for preview hash override in URL
  const urlHash = new URLSearchParams(window.location.search).get('x');
  if (urlHash) {
    const forced = SEGMENTS.find((s) => s.preview_hash === urlHash);
    if (forced) return forced;
  }

  // Check for previously assigned segment (sticky assignment)
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    const found = SEGMENTS.find((s) => s.id === Number(stored));
    if (found) return found;
  }

  // Random assignment based on percentages
  const rand = Math.random();
  let cumulative = 0;
  for (const segment of SEGMENTS) {
    cumulative += segment.percentage;
    if (rand < cumulative) {
      sessionStorage.setItem(STORAGE_KEY, String(segment.id));
      return segment;
    }
  }

  // Fallback to first segment
  sessionStorage.setItem(STORAGE_KEY, String(SEGMENTS[0].id));
  return SEGMENTS[0];
}

export function trackEvent(
  eventId: string,
  segment: Segment,
  userId?: string,
  metadata?: Record<string, unknown>
): void {
  fetch('http://localhost:9000/webhook/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_id: eventId,
      segment_id: segment.id,
      segment_name: segment.name,
      experiment_id: EXPERIMENT_ID,
      project_id: PROJECT_ID,
      timestamp: new Date().toISOString(),
      user_id: userId ?? undefined,
      metadata: metadata ?? {},
    }),
  }).catch(() => {
    // Silently fail - tracking should not break UX
  });
}
