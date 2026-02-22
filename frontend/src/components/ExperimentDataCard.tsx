import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '@/lib/axios';
import { cn } from '@/lib/utils';

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
  experimentId: number;
}

export const ExperimentDataCard = ({ experimentId }: ExperimentDataCardProps) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/experiments/${experimentId}/events`);
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
  }, [experimentId]);

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
        <span className="text-slate-500">{expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</span>
        <span className="text-[10px] font-mono text-slate-500 uppercase">Raw Data</span>
        <span className="text-[10px] text-slate-600">
          {loading ? '…' : events.length}
        </span>
        {hasData && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fetchEvents(); }}
            className="ml-auto text-[9px] text-primary hover:text-primary-glow"
          >
            Refresh
          </button>
        )}
      </button>
      {expanded && (
        <div className="border-t border-white/5 px-2.5 py-2 max-h-[200px] overflow-y-auto scrollbar-hide">
          {loading && <p className="text-[10px] text-slate-500">Loading…</p>}
          {error && (
            <p className="text-[10px] text-red-400">{error}</p>
          )}
          {!loading && !error && events.length === 0 && (
            <p className="text-[10px] text-slate-500">No events yet</p>
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
