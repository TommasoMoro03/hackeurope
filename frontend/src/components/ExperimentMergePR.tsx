import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { ExternalLink, Link2 } from 'lucide-react';
import { SplitPreviewPanel } from '@/components/SplitPreviewPanel';

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

interface ExperimentMergePRProps {
  experiment: Experiment;
  onMerged: () => void;
  onExperimentUpdate?: (updates: Partial<Experiment>) => void;
}

export const ExperimentMergePR = ({
  experiment,
  onMerged,
  onExperimentUpdate,
}: ExperimentMergePRProps) => {
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

  const baseUrl = (experiment.preview_url || editUrl).trim();
  const hashes = experiment.segment_preview_hashes;
  const controlSeg = experiment.segments?.[0];
  const variantSeg = experiment.segments?.[1];
  const controlHash = controlSeg && hashes?.[String(controlSeg.id)];
  const variantHash = variantSeg && hashes?.[String(variantSeg.id)];
  const sep = baseUrl.includes('?') ? '&' : '?';
  const controlUrl = baseUrl && controlHash ? `${baseUrl}${sep}x=${controlHash}` : undefined;
  const variantUrl = baseUrl && variantHash ? `${baseUrl}${sep}x=${variantHash}` : undefined;
  const hasPreview = !!(baseUrl && controlUrl && variantUrl);

  return (
    <div className="flex gap-6 min-h-0 flex-1 overflow-hidden">
      <aside className="w-[340px] shrink-0 flex flex-col gap-4 overflow-y-auto">
      {/* PR Created - main card */}
      <div className="glass-panel-vibe rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <ExternalLink className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Pull Request Created!</h2>
            <p className="text-sm text-slate-400">
              Review and merge to activate <span className="text-white font-medium">{experiment.name}</span>
            </p>
          </div>
        </div>

        {experiment.pr_url && (
          <a
            href={experiment.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-colors font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Open Pull Request
          </a>
        )}

        <ol className="mt-5 space-y-2 text-sm text-slate-400">
          <li className="flex gap-2">
            <span className="text-primary font-mono">1.</span>
            <span>Review the PR and deploy a preview (e.g. Vercel, Netlify)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-mono">2.</span>
            <span>Add your preview URL below to see live preview</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-mono">3.</span>
            <span>Merge the PR, then click &quot;I Merged the PR&quot;</span>
          </li>
        </ol>
      </div>

      {/* Preview URL - prominent section */}
      <div className="glass-panel-vibe rounded-xl border border-primary/30 p-6 ring-1 ring-primary/10">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-white">Add Preview URL</h3>
          <span className="text-[10px] text-slate-500 uppercase">(after checking the PR)</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Just paste your deployed preview URL — Control and Variant B will load automatically with the right hashes.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="https://your-preview.vercel.app"
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 bg-black/30 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono text-sm"
            disabled={savingUrl}
          />
          <button
            type="button"
            onClick={handleSavePreviewUrl}
            disabled={savingUrl || editUrl === (experiment.preview_url ?? '')}
            className="px-4 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {savingUrl ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Merge button */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onMerged}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium text-base"
        >
          I Merged the PR
        </button>
        <p className="text-xs text-slate-500">Once merged, the experiment will become active</p>
      </div>
      </aside>

      {hasPreview && (
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-[400px]">
          <SplitPreviewPanel
            mode="live"
            controlLabel={controlSeg?.name ?? 'Control'}
            variantLabel={variantSeg?.name ?? 'Variant B'}
            controlUrl={controlUrl}
            variantUrl={variantUrl}
            controlData={`${((controlSeg?.percentage ?? 0) * 100).toFixed(0)}% traffic`}
            variantData={`${((variantSeg?.percentage ?? 0) * 100).toFixed(0)}% traffic`}
          />
        </main>
      )}
    </div>
  );
};
