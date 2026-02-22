import React, { useEffect, useRef } from 'react';

const EXPERIMENT_ID = 10;
const PROJECT_ID = 8;
const WEBHOOK_URL = 'http://localhost:9000/webhook/event';

const SEGMENTS = [
  { id: 19, name: 'A', preview_hash: 'QWKA5dIPcuE', percentage: 0.5 },
  { id: 20, name: 'B', preview_hash: 'Wk_uCf--MoQ', percentage: 0.5 },
];

function assignSegment() {
  const urlHash =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('x')
      : null;

  if (urlHash) {
    const forced = SEGMENTS.find((s) => s.preview_hash === urlHash);
    if (forced) return forced;
  }

  const rand = Math.random();
  let cumulative = 0;
  for (const seg of SEGMENTS) {
    cumulative += seg.percentage;
    if (rand < cumulative) return seg;
  }
  return SEGMENTS[SEGMENTS.length - 1];
}

function trackEvent(
  eventId: string,
  segmentId: number,
  segmentName: string
) {
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_id: eventId,
      segment_id: segmentId,
      segment_name: segmentName,
      experiment_id: EXPERIMENT_ID,
      project_id: PROJECT_ID,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {});
}

interface SigninButtonProps {
  segment: { id: number; name: string; preview_hash: string; percentage: number };
}

function SegmentA({ segment }: SigninButtonProps) {
  return (
    <button
      style={{
        padding: '10px 24px',
        fontSize: '16px',
        cursor: 'pointer',
        borderRadius: '4px',
        border: '1px solid #ccc',
        background: '#ffffff',
        color: '#333',
      }}
      onClick={() => trackEvent('button_click', segment.id, segment.name)}
    >
      Sign In
    </button>
  );
}

function SegmentB({ segment }: SigninButtonProps) {
  return (
    <button
      style={{
        padding: '10px 24px',
        fontSize: '16px',
        cursor: 'pointer',
        borderRadius: '4px',
        border: '1px solid #e6b800',
        background: '#FFD700',
        color: '#333',
      }}
      onClick={() => trackEvent('button_click', segment.id, segment.name)}
    >
      Sign In
    </button>
  );
}

export default function SigninButtonExperiment() {
  const segmentRef = useRef(assignSegment());
  const segment = segmentRef.current;
  const trackedView = useRef(false);

  useEffect(() => {
    if (!trackedView.current) {
      trackedView.current = true;
      trackEvent('button_view', segment.id, segment.name);
    }
  }, [segment.id, segment.name]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        gap: '16px',
      }}
    >
      <h2 style={{ marginBottom: '8px' }}>Sign in to your account</h2>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        Experiment: Signin Button Roundness Test &mdash; Variant {segment.name}
      </p>
      {segment.name === 'A' ? (
        <SegmentA segment={segment} />
      ) : (
        <SegmentB segment={segment} />
      )}
    </div>
  );
}
