import { GlassPanel } from '@/components/ui/glass-panel';
import { cn } from '@/lib/utils';

interface Segment {
  id: number;
  name: string;
  instructions: string;
  percentage: number;
}

interface Experiment {
  id: number;
  name: string;
  description: string;
  status: string;
  percentage: number;
  metrics: string;
  segments: Segment[];
  created_at: string;
}

interface ExperimentDetailsProps {
  experiment: Experiment;
}

export const ExperimentDetails = ({ experiment }: ExperimentDetailsProps) => {
  return (
    <div className="max-w-4xl space-y-6">
      <GlassPanel title={`experiment — ${experiment.name}`}>
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-serif font-bold text-white">{experiment.name}</h2>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-mono uppercase',
                  experiment.status === 'active' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
                  experiment.status === 'paused' && 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                  !['active', 'paused'].includes(experiment.status) && 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                )}
              >
                {experiment.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">Created {new Date(experiment.created_at).toLocaleDateString()}</p>
          </div>

          <div>
            <h3 className={cn('text-xs font-mono uppercase tracking-wider text-slate-400 mb-2')}>Description</h3>
            <p className="text-slate-300">{experiment.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-white/5 bg-black/20">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">User Coverage</h3>
              <p className="text-2xl font-bold text-white">{experiment.percentage}%</p>
            </div>
            <div className="p-4 rounded-lg border border-white/5 bg-black/20">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">Segments</h3>
              <p className="text-2xl font-bold text-white">{experiment.segments.length}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Metrics</h3>
            <p className="text-slate-300 whitespace-pre-wrap font-mono text-sm">{experiment.metrics}</p>
          </div>

          <div>
            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-4">Segments</h3>
            <div className="space-y-4">
              {experiment.segments.map((segment) => (
                <div key={segment.id} className="p-4 rounded-lg border border-white/5 bg-black/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{segment.name}</h4>
                    <span className="text-sm font-mono text-primary-glow">
                      {(segment.percentage * 100).toFixed(1)}% of users
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 whitespace-pre-wrap">{segment.instructions}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
