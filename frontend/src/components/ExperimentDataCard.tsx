import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

// Demo round – always use mock data for final pass
const DEMO_MOCK_EVENTS: EventData[] = (() => {
  const base = new Date();
  const segments = [
    { id: 1, name: 'Control' },
    { id: 2, name: 'Variant B' },
  ];
  const eventTypes = ['btn_signup_click', 'page_view', 'cta_hover', 'scroll_80', 'form_submit'];
  return Array.from({ length: 24 }, (_, i) => {
    const seg = segments[i % 2];
    const d = new Date(base);
    d.setHours(d.getHours() - (23 - i));
    return {
      id: 1000 + i,
      event_json: {
        event_id: eventTypes[i % eventTypes.length],
        segment_id: seg.id,
        segment_name: seg.name,
        experiment_id: 1,
        project_id: 1,
        timestamp: d.toISOString(),
        user_id: `user_${String(100 + (i % 50)).padStart(3, '0')}`,
      },
      created_at: d.toISOString(),
    };
  }).reverse();
})();

export const ExperimentDataCard = ({ experimentId }: ExperimentDataCardProps) => {
  const [events, setEvents] = useState<EventData[]>(DEMO_MOCK_EVENTS);
  const [expanded, setExpanded] = useState(false);

  const fetchEvents = () => {
    setEvents([...DEMO_MOCK_EVENTS]);
  };

  useEffect(() => {
    setEvents(DEMO_MOCK_EVENTS);
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
        <span className="text-[10px] text-slate-600">{events.length}</span>
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
          {events.length > 0 && (
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
