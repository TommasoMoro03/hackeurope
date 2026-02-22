import { Lightbulb, Sparkles, Info, CheckCircle2, XCircle } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import type { ExperimentFormData } from '@/components/ExperimentForm';

interface IterationSuggestion {
  rational: string;
  experiment: {
    name: string;
    description: string;
    metrics: string;
    hypothesis: string;
  };
  segments: Array<{
    name: string;
    instructions: string;
    percentage: number;
    reasoning: string;
  }>;
  iteration_strategy: string;
}

interface ExperimentIterationSuggestionProps {
  suggestion: IterationSuggestion;
  basedOnExperimentName: string;
  onAccept: (formData: ExperimentFormData) => void;
  onReject: () => void;
}

export const ExperimentIterationSuggestion = ({
  suggestion,
  basedOnExperimentName,
  onAccept,
  onReject,
}: ExperimentIterationSuggestionProps) => {
  const handleAccept = () => {
    // Convert suggestion to ExperimentFormData format
    const formData: ExperimentFormData = {
      name: suggestion.experiment.name,
      description: suggestion.experiment.description,
      metrics: suggestion.experiment.metrics,
      percentage: 100, // Default to 100% coverage
      segments: suggestion.segments.map((seg) => ({
        name: seg.name,
        instructions: seg.instructions,
        percentage: seg.percentage,
      })),
    };
    onAccept(formData);
  };

  return (
    <div className="space-y-3 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
      {/* Header */}
      <GlassPanel className="rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500/30">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-purple-500/20 rounded-full p-2 shrink-0">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white mb-1">Next Experiment Suggestion</h2>
              <p className="text-xs text-purple-400/90">Based on: {basedOnExperimentName}</p>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Rationale */}
      <GlassPanel title="Why This Iteration?" className="rounded-lg">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">{suggestion.rational}</p>
          </div>
        </div>
      </GlassPanel>

      {/* Strategy */}
      <GlassPanel title="Iteration Strategy" className="rounded-lg">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-primary-glow shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">{suggestion.iteration_strategy}</p>
          </div>
        </div>
      </GlassPanel>

      {/* Experiment Details */}
      <GlassPanel title="Proposed Experiment" className="rounded-lg">
        <div className="p-4 space-y-3">
          <div>
            <p className="text-[10px] text-slate-500 uppercase mb-1">Name</p>
            <p className="text-sm font-semibold text-white">{suggestion.experiment.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase mb-1">Description</p>
            <p className="text-xs text-slate-300">{suggestion.experiment.description}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase mb-1">Hypothesis</p>
            <p className="text-xs text-slate-300 italic">{suggestion.experiment.hypothesis}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase mb-1">Metrics to Track</p>
            <p className="text-xs font-mono text-primary-glow">{suggestion.experiment.metrics}</p>
          </div>
        </div>
      </GlassPanel>

      {/* Segments */}
      <GlassPanel title="Proposed Segments" className="rounded-lg">
        <div className="p-4 space-y-3">
          {suggestion.segments.map((segment, index) => (
            <div
              key={index}
              className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-0.5">{segment.name}</h4>
                  <p className="text-xs text-slate-400">{segment.instructions}</p>
                </div>
                <span className="text-xs font-mono text-primary-glow shrink-0">
                  {(segment.percentage * 100).toFixed(0)}%
                </span>
              </div>
              <div className="pt-2 border-t border-white/5">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Reasoning</p>
                <p className="text-xs text-slate-400 italic">{segment.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 sticky bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-4 pb-2">
        <button
          onClick={onReject}
          className="py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 font-medium text-sm transition-all flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Regenerate
        </button>
        <button
          onClick={handleAccept}
          className="py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Accept & Create
        </button>
      </div>
    </div>
  );
};
