import { EXPERIMENT_CONFIG, WEBHOOK_URL } from "./experimentConfig";

export function trackEvent(
  eventId: string,
  segmentId: number,
  segmentName: string,
  userId?: string
) {
  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_id: eventId,
      segment_id: segmentId,
      segment_name: segmentName,
      experiment_id: EXPERIMENT_CONFIG.id,
      project_id: EXPERIMENT_CONFIG.project_id,
      timestamp: new Date().toISOString(),
      user_id: userId ?? undefined,
      metadata: {}
    })
  }).catch(() => {
    // Silently ignore tracking errors to avoid disrupting UX
  });
}
