import { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { api } from '@/lib/axios';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <GlassPanel className="rounded-lg shrink-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">Raw Data</span>
          {!loading && !error && events.length > 0 && (
            <span className="text-[10px] text-slate-500 font-mono">
              ({events.length} events)
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 overflow-y-auto scrollbar-hide max-h-[300px] border-t border-white/5">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-slate-500">Loading event data...</p>
            </div>
          )}
          {error && (
            <div className="text-xs text-red-400 border border-red-500/30 rounded-lg px-3 py-2 mt-3">
              {error}
            </div>
          )}
          {!loading && !error && events.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">No events tracked yet</p>
          )}
          {!loading && !error && events.length > 0 && (
            <div className="space-y-3 mt-3">
              <div className="flex items-center justify-end">
                <button
                  onClick={fetchEvents}
                  className="text-[10px] text-primary hover:text-primary-glow font-medium"
                >
                  Refresh
                </button>
              </div>
              <div className="space-y-2 overflow-x-auto scrollbar-hide">
                {events.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="p-2 rounded border border-white/5 bg-black/20 text-xs font-mono"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 truncate">{event.event_json.event_id}</span>
                      <span className="text-primary-glow shrink-0">{event.event_json.segment_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(event.event_json.timestamp).toLocaleString()}
                      {event.event_json.user_id && ` • ${event.event_json.user_id}`}
                    </div>
                  </div>
                ))}
                {events.length > 10 && (
                  <p className="text-[10px] text-slate-500">+{events.length - 10} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
};
