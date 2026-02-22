import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';

interface ExperimentIteratingProps {
  experimentId: number;
  experimentName: string;
  onComplete: () => void;
  inline?: boolean;
}

const ITERATION_STEPS = [
  'Analyzing experiment results...',
  'Identifying key insights and patterns...',
  'Evaluating winning variants...',
  'Designing next iteration strategy...',
  'Formulating hypothesis for follow-up...',
  'Generating experiment suggestions...',
];

export const ExperimentIterating = ({
  experimentName,
  onComplete,
  inline = false,
}: ExperimentIteratingProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        const next = (prev + 1) % ITERATION_STEPS.length;
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Poll to check if iteration is complete
    // For now, we'll rely on parent component to call onComplete
    // when the iteration endpoint returns
  }, [onComplete]);

  const content = (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <div className="size-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">Generating Next Iteration</h3>
        <p className="text-xs text-slate-400">{experimentName}</p>
      </div>

      <div className="space-y-2">
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / ITERATION_STEPS.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 text-center min-h-[2.5rem] flex items-center justify-center">
          {ITERATION_STEPS[currentStepIndex]}
        </p>
      </div>

      <p className="text-[10px] text-slate-500 text-center">
        This may take a moment...
      </p>
    </div>
  );

  if (inline) {
    return <GlassPanel className="rounded-lg">{content}</GlassPanel>;
  }

  return content;
};
