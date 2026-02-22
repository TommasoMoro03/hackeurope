import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { Check, X, Loader2, ExternalLink } from 'lucide-react';

interface ExperimentProgressStepsProps {
  experimentId: number;
  experimentName: string;
  onComplete: (experimentId?: number) => void;
  compact?: boolean;
  onExperimentUpdate?: (updates: { preview_url?: string }) => void;
  /** When true, PR Created UI is rendered in the right panel; show compact steps here */
  creationCompleteInRightPanel?: boolean;
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
  onExperimentUpdate,
  creationCompleteInRightPanel = false,
}: ExperimentProgressStepsProps) => {
  const [status, setStatus] = useState<string>('started');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState('');
  const [savingPreview, setSavingPreview] = useState(false);
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
        if (response.data.pr_url) setPrUrl(response.data.pr_url);

        if (response.data.preview_url != null) {
          setPreviewUrl(response.data.preview_url);
          setEditPreviewUrl(response.data.preview_url || '');
        }
        if (newStatus === 'active' || newStatus === 'pr_created' || newStatus === 'failed') {
          if (newStatus === 'active' || newStatus === 'pr_created') {
            setSteps((prev) => prev.map((step) => ({ ...step, status: 'completed' as const })));
          }
          clearInterval(interval);
          clearInterval(stepInterval);
          if (newStatus === 'active' || newStatus === 'failed') {
            setTimeout(() => onComplete(experimentId), 1000);
          }
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

  const handleSavePreviewUrl = async () => {
    if (savingPreview) return;
    setSavingPreview(true);
    try {
      await api.patch(`/api/experiments/${experimentId}/preview-url`, {
        preview_url: editPreviewUrl.trim() || null,
      });
      setPreviewUrl(editPreviewUrl.trim() || null);
      onExperimentUpdate?.({ preview_url: editPreviewUrl.trim() || undefined });
    } catch (err) {
      setError('Failed to save preview URL');
    } finally {
      setSavingPreview(false);
    }
  };

  if ((status === 'active' || status === 'pr_created') && !creationCompleteInRightPanel) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center">
          <div className="size-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">PR Created!</h3>
          <p className="text-xs text-slate-400 mb-3">
            Open the PR, set your preview URL, then continue.
          </p>
        </div>

        {prUrl && (
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors text-sm font-medium break-all"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span className="truncate">{prUrl}</span>
          </a>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-400">Preview URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={editPreviewUrl}
              onChange={(e) => setEditPreviewUrl(e.target.value)}
              placeholder="https://preview.example.com/..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSavePreviewUrl}
              disabled={savingPreview || editPreviewUrl.trim() === (previewUrl ?? '')}
              className="px-4 py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shrink-0"
            >
              {savingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        </div>

        <button
          onClick={() => onComplete(experimentId)}
          className="w-full py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 font-medium text-sm"
        >
          Continue
        </button>
      </div>
    );
  }

  if ((status === 'active' || status === 'pr_created') && creationCompleteInRightPanel) {
    return (
      <div className={compact ? 'p-3 space-y-3' : 'p-4 space-y-4'}>
        <div className="mb-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400">All steps complete</h3>
          <p className="text-sm text-slate-400 mt-0.5 truncate">{experimentName}</p>
        </div>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-3 py-1">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-mono text-emerald-400">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-300">{step.label}</p>
              </div>
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 pt-2 border-t border-white/5">
          Add preview URL & continue in the panel →
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
