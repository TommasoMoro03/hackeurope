import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExperimentFinishingProps {
  experimentId: number;
  experimentName: string;
  onComplete: () => void;
  /** Inline mode: render as a panel in the sidebar instead of a modal overlay */
  inline?: boolean;
}

interface FinishingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

export const ExperimentFinishing = ({ experimentId, experimentName, onComplete, inline = false }: ExperimentFinishingProps) => {
  const [status, setStatus] = useState<string>('finishing');
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [steps, setSteps] = useState<FinishingStep[]>([
    { id: 'collect', label: 'Collecting experiment data', status: 'pending' },
    { id: 'analyze', label: 'Analyzing results', status: 'pending' },
    { id: 'generate', label: 'Generating final report', status: 'pending' },
    { id: 'finalize', label: 'Finalizing experiment', status: 'pending' },
  ]);

  useEffect(() => {
    let startTime = Date.now();

    // Simulate progress steps with timeouts
    const updateSteps = () => {
      const elapsed = Date.now() - startTime;

      // Step 1: Collecting (0-3s)
      if (elapsed >= 0) {
        setSteps(prev => prev.map(step =>
          step.id === 'collect' ? { ...step, status: 'loading' as const } : step
        ));
      }

      // Step 1 complete, Step 2 starts (3-6s)
      if (elapsed >= 3000) {
        setSteps(prev => prev.map(step =>
          step.id === 'collect' ? { ...step, status: 'completed' as const } :
          step.id === 'analyze' ? { ...step, status: 'loading' as const } : step
        ));
      }

      // Step 2 complete, Step 3 starts (6-9s)
      if (elapsed >= 6000) {
        setSteps(prev => prev.map(step =>
          step.id === 'analyze' ? { ...step, status: 'completed' as const } :
          step.id === 'generate' ? { ...step, status: 'loading' as const } : step
        ));
      }

      // Step 3 complete, Step 4 starts (9-12s)
      if (elapsed >= 9000) {
        setSteps(prev => prev.map(step =>
          step.id === 'generate' ? { ...step, status: 'completed' as const } :
          step.id === 'finalize' ? { ...step, status: 'loading' as const } : step
        ));
      }
    };

    const stepInterval = setInterval(updateSteps, 500);

    // Poll the actual status every 2 seconds
    const pollStatus = async () => {
      try {
        const response = await api.get(`/api/experiments/${experimentId}/status`);
        const newStatus = response.data?.status ?? response.data?.Status;
        setPollCount((c) => c + 1);
        if (newStatus) setStatus(newStatus);

        // If status is finished or failed, complete all steps and stop polling
        if (newStatus === 'finished' || newStatus === 'failed') {
          if (newStatus === 'finished') {
            setSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })));
          }
          clearInterval(interval);
          clearInterval(stepInterval);
          setTimeout(() => onComplete(), 1000);
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail ?? 'Failed to fetch experiment status');
        console.error('Error polling status:', err);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [experimentId, onComplete]);

  const renderStepIcon = (stepStatus: 'pending' | 'loading' | 'completed') => {
    if (stepStatus === 'completed') {
      return <Check className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (stepStatus === 'loading') {
      return <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />;
    }
    return <div className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0" />;
  };

  const content = (
    <div className={cn(inline ? 'p-4 space-y-4' : 'p-8')}>
      <div className="text-center mb-4">
        <h3 className={cn(
          'font-semibold mb-1',
          inline ? 'text-sm text-white' : 'text-xl text-gray-900'
        )}>
          {status === 'finished' ? 'Experiment Finished!' : status === 'failed' ? 'Error' : 'Finishing Experiment'}
        </h3>
        <p className={cn(
          'text-sm',
          inline ? 'text-slate-400' : 'text-gray-600'
        )}>
          {status === 'finished'
            ? `"${experimentName}" has been successfully finished`
            : status === 'failed'
            ? 'There was an error finishing your experiment'
            : 'Please wait while we finalize your experiment'}
        </p>
      </div>

      {/* Progress Steps */}
      {status === 'finishing' && (
        <div className="space-y-2 mb-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className="flex-shrink-0">{renderStepIcon(step.status)}</div>
              <p className={cn(
                'text-xs font-medium flex-1',
                step.status === 'completed' ? 'text-emerald-400' :
                step.status === 'loading' ? 'text-primary' :
                'text-slate-500'
              )}>
                {step.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Success Icon */}
      {status === 'finished' && (
        <div className="flex justify-center mb-4">
          <div className="size-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      )}

      {/* Error Icon */}
      {status === 'failed' && (
        <div className="flex justify-center mb-4">
          <div className="size-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-2xl">×</span>
          </div>
        </div>
      )}

      {error && (
        <div className={cn(
          'rounded-lg px-3 py-2 text-xs',
          inline ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
        )}>
          {error}
        </div>
      )}

      <p className={cn(
        'text-center text-xs',
        inline ? 'text-slate-500' : 'text-gray-500'
      )}>
        {status === 'finishing' && pollCount > 6
          ? 'Taking longer than usual — analysis still running…'
          : 'This may take a few moments'}
      </p>
    </div>
  );

  if (inline) {
    return (
      <div className="glass-panel-vibe rounded-lg border border-white/10 overflow-hidden">
        <div className="px-3 py-2 border-b border-white/5">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Finishing</h3>
          <p className="text-sm font-semibold text-white truncate">{experimentName}</p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {content}
      </div>
    </div>
  );
};
