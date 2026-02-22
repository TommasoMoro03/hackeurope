import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { ExternalLink, Link2 } from 'lucide-react';

interface Segment {
  id: number;
  name: string;
  percentage: number;
}

interface Experiment {
  id: number;
  name: string;
  pr_url?: string;
  preview_url?: string;
  segment_preview_hashes?: Record<string, string>;
  segments?: Segment[];
}

interface ExperimentPRFlowCardsProps {
  experiment: Experiment;
  onMerged: () => void;
  onExperimentUpdate?: (updates: Partial<Experiment>) => void;
}

export const ExperimentPRFlowCards = ({
  experiment,
  onMerged,
  onExperimentUpdate,
}: ExperimentPRFlowCardsProps) => {
  const [editUrl, setEditUrl] = useState(experiment.preview_url ?? '');
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    setEditUrl(experiment.preview_url ?? '');
  }, [experiment.preview_url]);

  const handleSavePreviewUrl = async () => {
    setSavingUrl(true);
    try {
      await api.patch(`/api/experiments/${experiment.id}/preview-url`, {
        preview_url: editUrl.trim() || null,
      });
      onExperimentUpdate?.({ preview_url: editUrl.trim() || undefined });
    } finally {
      setSavingUrl(false);
    }
  };

  return (
    <>
      {/* Flow: 1. PR → 2. Preview URL → 3. Merge */}
      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-slate-500">
        <span className="font-mono">1.Open PR</span>
        <span>→</span>
        <span className="font-mono text-primary">2.Add Preview</span>
        <span>→</span>
        <span className="font-mono">3.Merge</span>
      </div>

      {/* Step 1: Open PR */}
      <div className="glass-panel-vibe rounded-lg border border-white/10 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <ExternalLink className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-white">Pull Request Created</h2>
            <p className="text-xs text-slate-400 truncate">Review and merge to activate {experiment.name}</p>
          </div>
        </div>

        {experiment.pr_url && (
          <a
            href={experiment.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-colors font-medium text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Pull Request
          </a>
        )}

        <ol className="mt-2 space-y-1 text-[11px] text-slate-400">
          <li className="flex gap-1.5"><span className="text-primary font-mono shrink-0">1.</span><span>Review PR, deploy preview</span></li>
          <li className="flex gap-1.5"><span className="text-primary font-mono shrink-0">2.</span><span>Add preview URL below</span></li>
          <li className="flex gap-1.5"><span className="text-primary font-mono shrink-0">3.</span><span>Merge PR, click &quot;I Merged&quot;</span></li>
        </ol>
      </div>

      {/* Step 2: Add Preview URL */}
      <div className="glass-panel-vibe rounded-lg border border-primary/30 p-3 ring-1 ring-primary/10">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-mono text-primary">2</span>
          <Link2 className="w-4 h-4 text-primary shrink-0" />
          <h3 className="text-xs font-semibold text-white">Add Preview URL</h3>
        </div>
        <div className="flex gap-1.5">
          <input
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="https://your-preview.vercel.app"
            className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-black/30 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono text-xs"
            disabled={savingUrl}
          />
          <button
            type="button"
            onClick={handleSavePreviewUrl}
            disabled={savingUrl || editUrl === (experiment.preview_url ?? '')}
            className="px-3 py-2 rounded-lg bg-primary text-white font-medium text-xs hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {savingUrl ? '…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Step 3: Merge */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-slate-500 mb-0.5">Step 3</span>
        <button
          onClick={onMerged}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium text-sm"
        >
          I Merged the PR
        </button>
        <p className="text-[10px] text-slate-500">Once merged, experiment becomes active</p>
      </div>
    </>
  );
};
