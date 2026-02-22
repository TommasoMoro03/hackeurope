import { useState, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';

interface ExperimentIteratingProps {
  experimentId: number;
  experimentName: string;
  onComplete: () => void;
  inline?: boolean;
  hasResults?: boolean;
}

interface IterationStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

const INITIAL_STEPS: IterationStep[] = [
  { id: 'analyze', label: 'Analyzing experiment results', status: 'pending' },
  { id: 'insights', label: 'Identifying key insights', status: 'pending' },
  { id: 'strategy', label: 'Designing iteration strategy', status: 'pending' },
  { id: 'generate', label: 'Generating suggestions', status: 'pending' },
];

export const ExperimentIterating = ({
  experimentName,
  hasResults = false,
  inline = false,
}: ExperimentIteratingProps) => {
  const [steps, setSteps] = useState<IterationStep[]>(INITIAL_STEPS);

  useEffect(() => {
    if (hasResults) {
      // Mark all as completed when results are ready
      setSteps((prev) => prev.map((step) => ({ ...step, status: 'completed' as const })));
      return;
    }

    let startTime = Date.now();

    const updateSteps = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 0) {
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 'analyze' ? { ...step, status: 'loading' as const } : step
          )
        );
      }
      if (elapsed >= 2000) {
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 'analyze'
              ? { ...step, status: 'completed' as const }
              : step.id === 'insights'
                ? { ...step, status: 'loading' as const }
                : step
          )
        );
      }
      if (elapsed >= 4000) {
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 'insights'
              ? { ...step, status: 'completed' as const }
              : step.id === 'strategy'
                ? { ...step, status: 'loading' as const }
                : step
          )
        );
      }
      if (elapsed >= 6000) {
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 'strategy'
              ? { ...step, status: 'completed' as const }
              : step.id === 'generate'
                ? { ...step, status: 'loading' as const }
                : step
          )
        );
      }
    };

    const stepInterval = setInterval(updateSteps, 500);

    return () => clearInterval(stepInterval);
  }, [hasResults]);

  const renderStepIcon = (stepStatus: 'pending' | 'loading' | 'completed') => {
    if (stepStatus === 'completed') {
      return <Check className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (stepStatus === 'loading') {
      return <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />;
    }
    return <div className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0" />;
  };

  const content = (
    <div className="p-4 space-y-4">
      <div className="mb-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-purple-400">
          {hasResults ? 'Iteration Ready' : 'Generating Iteration'}
        </h3>
        <p className="text-sm text-slate-400 mt-0.5">{experimentName}</p>
      </div>
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="mt-0.5">{renderStepIcon(step.status)}</div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-medium ${
                  step.status === 'completed'
                    ? 'text-emerald-400'
                    : step.status === 'loading'
                      ? 'text-purple-400'
                      : 'text-slate-500'
                }`}
              >
                {step.label}
              </p>
              {step.status === 'loading' && (
                <p className="text-[10px] text-slate-500 mt-0.5">In progress...</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {!hasResults && (
        <p className="text-[10px] text-slate-500 mt-3">This may take a moment...</p>
      )}
      {hasResults && (
        <p className="text-[10px] text-slate-500 pt-2 border-t border-white/5">
          View suggestion in the panel →
        </p>
      )}
    </div>
  );

  if (inline) {
    return <GlassPanel className="rounded-lg">{content}</GlassPanel>;
  }

  return content;
};
