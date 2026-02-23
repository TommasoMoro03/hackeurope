import React, { useMemo } from "react";
import { EXPERIMENT_CONFIG } from "./experimentConfig";
import SegmentA from "./SegmentA";
import SegmentB from "./SegmentB";

function resolveSegment(): number {
  // 1. Check for preview hash override in URL
  const urlHash = new URLSearchParams(window.location.search).get("x");
  if (urlHash) {
    const forced = EXPERIMENT_CONFIG.segments.find(s => s.preview_hash === urlHash);
    if (forced) return forced.id;
  }

  // 2. Check for a previously assigned segment stored in sessionStorage
  const storageKey = `experiment_${EXPERIMENT_CONFIG.id}_segment`;
  const stored = sessionStorage.getItem(storageKey);
  if (stored) {
    const storedId = parseInt(stored, 10);
    if (EXPERIMENT_CONFIG.segments.some(s => s.id === storedId)) return storedId;
  }

  // 3. Random assignment based on segment percentages
  const rand = Math.random();
  let cumulative = 0;
  for (const segment of EXPERIMENT_CONFIG.segments) {
    cumulative += segment.percentage;
    if (rand < cumulative) {
      sessionStorage.setItem(storageKey, String(segment.id));
      return segment.id;
    }
  }

  // Fallback to first segment
  const fallback = EXPERIMENT_CONFIG.segments[0];
  sessionStorage.setItem(storageKey, String(fallback.id));
  return fallback.id;
}

const ColorChangeButtonTest: React.FC = () => {
  const segmentId = useMemo(() => resolveSegment(), []);

  if (segmentId === 23) return <SegmentA />;
  if (segmentId === 24) return <SegmentB />;
  return <SegmentA />;
};

export default ColorChangeButtonTest;
