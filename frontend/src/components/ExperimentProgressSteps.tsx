import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { Check, X, Loader2 } from 'lucide-react';

interface ExperimentProgressStepsProps {
  experimentId: number;
  experimentName: string;
  onComplete: (experimentId?: number) => void;
  compact?: boolean;
}

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

export const ExperimentProgressSteps = ({
  experimentId,
  experimentName,
  onComplete,
  compact = false,
}: ExperimentProgressStepsProps) => {
  const [status, setStatus] = useState<string>('started');
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<ProgressStep[]>([
    { id: 'analyze', label: 'Analyzing experiment requirements', status: 'pending' },
    { id: 'events', label: 'Extracting tracking events', status: 'pending' },
    { id: 'code', label: 'Generating implementation code', status: 'pending' },
    { id: 'pr', label: 'Creating pull request', status: 'pending' },
  ]);

  useEffect(() => {
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
              : step.id === 'events'
                ? { ...step, status: 'loading' as const }
                : step
          )
        );
      }
      if (elapsed >= 5000) {
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 'events'
              ? { ...step, status: 'completed' as const }
              : step.id === 'code'
                ? { ...step, status: 'loading' as const }
                : step
          )
        );
      }
      if (elapsed >= 10000) {
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 'code'
              ? { ...step, status: 'completed' as const }
              : step.id === 'pr'
                ? { ...step, status: 'loading' as const }
                : step
          )
        );
      }
    };

    const stepInterval = setInterval(updateSteps, 500);

    let interval: ReturnType<typeof setInterval>;
    const pollStatus = async () => {
      try {
        const response = await api.get(`/api/experiments/${experimentId}/status`);
        const newStatus = response.data.status;
        setStatus(newStatus);

        if (newStatus === 'active' || newStatus === 'failed') {
          if (newStatus === 'active') {
            setSteps((prev) => prev.map((step) => ({ ...step, status: 'completed' as const })));
          }
          clearInterval(interval);
          clearInterval(stepInterval);
          setTimeout(() => onComplete(experimentId), 1000);
        }
      } catch (err: any) {
        setError('Failed to fetch experiment status');
        console.error('Error polling status:', err);
      }
    };

    pollStatus();
    interval = setInterval(pollStatus, 2000);

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
      return <Loader2 className="w-4 h-4 text-primary-glow animate-spin shrink-0" />;
    }
    return <div className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0" />;
  };

  if (status === 'active') {
    return (
      <div className="p-4 text-center">
        <div className="size-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">Implementation Complete!</h3>
        <p className="text-xs text-slate-400">
          A pull request has been created. Review and merge it to activate.
        </p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="p-4 text-center">
        <div className="size-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
          <X className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">Implementation Failed</h3>
        <p className="text-xs text-slate-400">Please try again or contact support.</p>
      </div>
    );
  }

  return (
    <div className={compact ? 'p-3 space-y-2' : 'p-4 space-y-3'}>
      <div className="mb-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
          {status === 'active' ? 'Success!' : 'Implementing'}
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">{experimentName}</p>
      </div>
      {steps.map((step) => (
        <div key={step.id} className="flex items-start gap-3">
          <div className="mt-0.5">{renderStepIcon(step.status)}</div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-xs font-medium ${
                step.status === 'completed'
                  ? 'text-emerald-400'
                  : step.status === 'loading'
                    ? 'text-primary-glow'
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
      <p className="text-[10px] text-slate-500 mt-3">This may take a couple of minutes</p>
      {error && (
        <div className="mt-2 text-xs text-red-400 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
};
