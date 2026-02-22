import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { Check, ExternalLink, Link2, Loader2 } from 'lucide-react';
import { SegmentSummaryCards } from '@/components/SegmentSummaryCards';

interface Segment {
  id: number;
  name: string;
  instructions: string;
  percentage: number;
}

interface CreationCompletePanelProps {
  experimentId: number;
  experimentName: string;
  prUrl?: string | null;
  initialPreviewUrl?: string | null;
  segments?: Segment[];
  onComplete: (experimentId?: number) => void;
  onExperimentUpdate?: (updates: { preview_url?: string }) => void;
}

export const CreationCompletePanel = ({
  experimentId,
  experimentName,
  prUrl,
  initialPreviewUrl,
  segments,
  onComplete,
  onExperimentUpdate,
}: CreationCompletePanelProps) => {
  const [editPreviewUrl, setEditPreviewUrl] = useState(initialPreviewUrl ?? '');
  const [savingPreview, setSavingPreview] = useState(false);

  useEffect(() => {
    setEditPreviewUrl(initialPreviewUrl ?? '');
  }, [initialPreviewUrl]);

  const handleSavePreviewUrl = async () => {
    setSavingPreview(true);
    try {
      await api.patch(`/api/experiments/${experimentId}/preview-url`, {
        preview_url: editPreviewUrl.trim() || null,
      });
      onExperimentUpdate?.({ preview_url: editPreviewUrl.trim() || undefined });
    } finally {
      setSavingPreview(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto scrollbar-hide">
      {/* Success header */}
      <div className="text-center">
        <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
          <Check className="w-5 h-5 text-emerald-400" />
        </div>
        <h2 className="text-sm font-semibold text-white mb-0.5">PR Created!</h2>
        <p className="text-[11px] text-slate-400">
          <span className="text-white font-medium">{experimentName}</span> — add preview URL below
        </p>
      </div>

      {/* A/B segment summary */}
      {segments && segments.length >= 2 && (
        <SegmentSummaryCards
          control={{
            name: segments[0].name,
            instructions: segments[0].instructions,
            percentage: segments[0].percentage,
          }}
          variant={{
            name: segments[1].name,
            instructions: segments[1].instructions,
            percentage: segments[1].percentage,
          }}
          compact
        />
      )}

      {/* Open PR */}
      {prUrl && (
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-lg bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-colors text-xs font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          Open Pull Request
        </a>
      )}

      {/* Preview URL */}
      <div className="glass-panel-vibe rounded-lg border border-primary/30 p-3 ring-1 ring-primary/10">
        <div className="flex items-center gap-1.5 mb-2">
          <Link2 className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-semibold text-white">Preview URL</h3>
        </div>
        <p className="text-[10px] text-slate-400 mb-2">
          Paste deployed preview URL. A/B load with right hashes.
        </p>
        <div className="flex gap-1.5">
          <input
            type="url"
            value={editPreviewUrl}
            onChange={(e) => setEditPreviewUrl(e.target.value)}
            placeholder="https://your-preview.vercel.app"
            className="flex-1 px-2.5 py-2 rounded border border-white/10 bg-black/30 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary/30 focus:border-primary outline-none font-mono text-xs min-w-0"
            disabled={savingPreview}
          />
          <button
            type="button"
            onClick={handleSavePreviewUrl}
            disabled={savingPreview || editPreviewUrl.trim() === (initialPreviewUrl ?? '')}
            className="px-3 py-2 rounded bg-primary text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {savingPreview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>

      {/* Continue */}
      <div className="mt-auto pt-2">
        <button
          onClick={() => onComplete(experimentId)}
          className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
        >
          Continue
        </button>
        <p className="text-[10px] text-slate-500 text-center mt-1">
          Opens the experiment
        </p>
      </div>
    </div>
  );
};
