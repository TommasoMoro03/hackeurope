import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Zap, Loader2 } from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/lib/utils';
import type { Experiment } from '@/types/experiment';

interface EventData {
  id: number;
  event_json: {
    event_id: string;
    segment_id: number;
    segment_name: string;
    experiment_id: number;
    project_id: number;
    timestamp: string;
    user_id?: string;
    metadata?: Record<string, unknown>;
  };
  created_at: string;
}

interface ExperimentDataCardProps {
  experiment: Experiment;
  projectId: number;
}

const EVENT_TYPES = ['btn_signup_click', 'page_view', 'cta_hover', 'scroll_80', 'form_submit'];
const WEBHOOK_URL = 'http://localhost:8001/webhook/event';

export const ExperimentDataCard = ({ experiment, projectId }: ExperimentDataCardProps) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState<{ sent: number; total: number } | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/experiments/${experiment.id}/events`);
      setEvents(response.data);
      setError(null);
    } catch (err: unknown) {
      setError('Failed to load event data');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [experiment.id]);

  const handleSimulate = async () => {
    const segments = experiment.segments;
    if (!segments || segments.length === 0) return;

    const count = 60;
    setSimulating(true);
    setSimProgress({ sent: 0, total: count });

    const baseTime = Date.now();

    for (let i = 0; i < count; i++) {
      // Distribute across segments weighted by percentage
      let seg = segments[0];
      const rand = Math.random();
      let cumulative = 0;
      for (const s of segments) {
        cumulative += s.percentage;
        if (rand < cumulative) { seg = s; break; }
      }

      const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
      const userId = `sim_user_${String(Math.floor(Math.random() * 200) + 1).padStart(3, '0')}`;
      const timestamp = new Date(baseTime - (count - i) * 60_000 * 2).toISOString();

      const payload = {
        event_id: eventType,
        segment_id: seg.id,
        segment_name: seg.name,
        experiment_id: experiment.id,
        project_id: projectId,
        timestamp,
        user_id: userId,
        metadata: { simulated: true, index: i },
      };

      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // webhook might not be running locally, silently skip
      }

      setSimProgress({ sent: i + 1, total: count });

      // small delay to avoid hammering
      if (i % 10 === 9) await new Promise((r) => setTimeout(r, 80));
    }

    setSimulating(false);
    setSimProgress(null);
    // Refresh to show real data
    fetchEvents();
  };

  const hasData = events.length > 0;

  return (
    <div
      className={cn(
        'rounded-lg border border-white/5 overflow-hidden transition-all',
        hasData && 'bg-black/20'
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-slate-500">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
        <span className="text-[10px] font-mono text-slate-500 uppercase">Raw Data</span>
        <span className="text-[10px] text-slate-600">
          {loading ? '…' : events.length}
        </span>

        <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {simulating && simProgress && (
            <span className="text-[9px] text-primary font-mono">
              {simProgress.sent}/{simProgress.total}
            </span>
          )}
          <button
            type="button"
            onClick={handleSimulate}
            disabled={simulating}
            title="Simulate 60 events to local webhook"
            className="flex items-center gap-1 text-[9px] text-yellow-400 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {simulating
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Zap className="w-3 h-3" />
            }
            {simulating ? 'Simulating…' : 'Simulate'}
          </button>
          {hasData && !simulating && (
            <button
              type="button"
              onClick={fetchEvents}
              className="text-[9px] text-primary hover:text-primary-glow"
            >
              Refresh
            </button>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-2.5 py-2 max-h-[200px] overflow-y-auto scrollbar-hide">
          {loading && <p className="text-[10px] text-slate-500">Loading…</p>}
          {error && <p className="text-[10px] text-red-400">{error}</p>}
          {!loading && !error && events.length === 0 && (
            <p className="text-[10px] text-slate-500">No events yet — hit Simulate to generate data</p>
          )}
          {!loading && !error && events.length > 0 && (
            <div className="space-y-1.5">
              {events.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="p-1.5 rounded border border-white/5 bg-black/20 text-[10px] font-mono"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 truncate">{event.event_json.event_id}</span>
                    <span className="text-primary shrink-0">{event.event_json.segment_name}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    {new Date(event.event_json.timestamp).toLocaleString()}
                    {event.event_json.user_id && ` • ${event.event_json.user_id}`}
                  </div>
                </div>
              ))}
              {events.length > 10 && (
                <p className="text-[9px] text-slate-500">+{events.length - 10} more</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
