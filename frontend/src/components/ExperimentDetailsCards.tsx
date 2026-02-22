import { GlassPanel } from '@/components/ui/glass-panel';
import { TrafficSplitSlider } from '@/components/TrafficSplitSlider';
import { cn } from '@/lib/utils';
import type { Experiment } from '@/types/experiment';

interface ExperimentDetailsCardsProps {
  experiment: Experiment;
  onExperimentUpdate?: (updates: Partial<Experiment>) => void;
  onFinish?: () => void;
  onIterate?: () => void;
  isFinishing?: boolean;
}

export const ExperimentDetailsCards = ({
  experiment,
  onExperimentUpdate,
  onFinish,
  onIterate,
  isFinishing = false,
}: ExperimentDetailsCardsProps) => {
  const controlSegment = experiment.segments[0];
  const variantSegment = experiment.segments[1];

  return (
    <>
      {/* Config card - matches Test Configuration during create */}
      <GlassPanel title="Test Configuration" className="rounded-lg">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white truncate">{experiment.name}</h3>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-mono uppercase shrink-0',
                experiment.status === 'active' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
                experiment.status === 'paused' && 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                !['active', 'paused'].includes(experiment.status) && 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
              )}
            >
              {experiment.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2">{experiment.description}</p>
          <div className="space-y-1.5">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Traffic split</p>
            <TrafficSplitSlider
              aPercent={(controlSegment?.percentage ?? 0.5) * 100}
              onSplitChange={() => {}}
              aLabel={controlSegment?.name ?? 'A'}
              bLabel={variantSegment?.name ?? 'B'}
              disabled
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg border border-white/5 bg-black/20">
              <p className="text-[10px] text-slate-500">Coverage</p>
              <p className="text-lg font-bold text-white">{experiment.percentage}%</p>
            </div>
            <div className="p-2 rounded-lg border border-white/5 bg-black/20">
              <p className="text-[10px] text-slate-500">Metrics</p>
              <p className="text-xs text-white font-mono truncate" title={experiment.metrics}>
                {experiment.metrics || '-'}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Created {new Date(experiment.created_at).toLocaleDateString()}
          </p>
          {experiment.status === 'active' && onFinish && (
            <button
              type="button"
              onClick={onFinish}
              disabled={isFinishing}
              className="w-full mt-3 py-2 px-3 rounded-lg bg-primary hover:bg-primary-glow text-white text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isFinishing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Starting…
                </>
              ) : (
                'Finish Experiment'
              )}
            </button>
          )}
          {experiment.status === 'finished' && onIterate && (
            <button
              type="button"
              onClick={onIterate}
              className="w-full mt-3 py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-medium transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Iterate
            </button>
          )}
        </div>
      </GlassPanel>
    </>
  );
};
