import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Check, X, Loader2 } from 'lucide-react';

interface ExperimentProgressProps {
  experimentId: number;
  experimentName: string;
  onComplete: () => void;
}

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

export const ExperimentProgress = ({ experimentId, experimentName, onComplete }: ExperimentProgressProps) => {
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
        setSteps(prev => prev.map(step =>
          step.id === 'analyze' ? { ...step, status: 'loading' as const } : step
        ));
      }
      if (elapsed >= 2000) {
        setSteps(prev => prev.map(step =>
          step.id === 'analyze' ? { ...step, status: 'completed' as const } :
          step.id === 'events' ? { ...step, status: 'loading' as const } : step
        ));
      }
      if (elapsed >= 5000) {
        setSteps(prev => prev.map(step =>
          step.id === 'events' ? { ...step, status: 'completed' as const } :
          step.id === 'code' ? { ...step, status: 'loading' as const } : step
        ));
      }
      if (elapsed >= 10000) {
        setSteps(prev => prev.map(step =>
          step.id === 'code' ? { ...step, status: 'completed' as const } :
          step.id === 'pr' ? { ...step, status: 'loading' as const } : step
        ));
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
            setSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })));
          }
          clearInterval(interval);
          clearInterval(stepInterval);
          setTimeout(() => onComplete(), 1000);
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
      return <Check className="w-5 h-5 text-emerald-400" />;
    }
    if (stepStatus === 'loading') {
      return <Loader2 className="w-5 h-5 text-primary-glow animate-spin" />;
    }
    return <div className="w-5 h-5 rounded-full border-2 border-white/20" />;
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-xl font-serif font-bold text-white mb-2">
            {status === 'active' ? 'Success!' : status === 'failed' ? 'Error' : 'Implementing Experiment'}
          </h2>
          <p className="text-slate-400">
            {status === 'active'
              ? `Your experiment "${experimentName}" is now ready!`
              : status === 'failed'
              ? 'There was an error implementing your experiment'
              : 'Please wait while we set up your experiment'}
          </p>
        </div>

        {(status === 'started' || status === 'implementing') && (
          <GlassPanel title="progress">
            <div className="p-6 space-y-4">
              {steps.map((step) => (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">{renderStepIcon(step.status)}</div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        step.status === 'completed' ? 'text-emerald-400' :
                        step.status === 'loading' ? 'text-primary-glow' :
                        'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.status === 'loading' && (
                      <p className="text-xs text-slate-500 mt-1">In progress...</p>
                    )}
                    {step.status === 'completed' && (
                      <p className="text-xs text-emerald-400/80 mt-1">Completed</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="mt-6 text-center text-xs text-slate-500 font-mono">
                This operation may take a couple of minutes
              </div>
            </div>
          </GlassPanel>
        )}

        {status === 'active' && (
          <GlassPanel title="complete">
            <div className="p-8 text-center">
              <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Implementation Complete!</h3>
              <p className="text-slate-400 text-sm">
                A pull request has been created in your repository. Review and merge it to activate the experiment.
              </p>
            </div>
          </GlassPanel>
        )}

        {status === 'failed' && (
          <GlassPanel title="error">
            <div className="p-8 text-center">
              <div className="size-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-400" /> 
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Implementation Failed</h3>
              <p className="text-slate-400 text-sm">
                There was an error implementing your experiment. Please try again or contact support.
              </p>
            </div>
          </GlassPanel>
        )}

        {error && (
          <div className="mt-4 glass-panel-vibe border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
