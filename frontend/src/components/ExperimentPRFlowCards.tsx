import { ExternalLink } from 'lucide-react';
import type { Experiment } from '@/types/experiment';

interface ExperimentPRFlowCardsProps {
  experiment: Experiment;
  onMerged: () => void;
  onExperimentUpdate?: (updates: Partial<Experiment>) => void;
}

export const ExperimentPRFlowCards = ({
  experiment,
  onMerged,
  onExperimentUpdate: _onExperimentUpdate,
}: ExperimentPRFlowCardsProps) => {

  return (
    <div className="glass-panel-vibe rounded-lg border border-white/10 p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <ExternalLink className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-white">PR Ready</h2>
          <p className="text-[11px] text-slate-400 truncate">Review, add base URL, then merge</p>
        </div>
      </div>

      {experiment.pr_url && (
        <a
          href={experiment.pr_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-colors font-medium text-xs mb-2"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open PR
        </a>
      )}

      <button
        onClick={onMerged}
        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium text-xs"
      >
        I Merged the PR
      </button>
    </div>
  );
};
