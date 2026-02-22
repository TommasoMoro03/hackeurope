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
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      {/* Success header */}
      <div className="text-center">
        <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-1">Pull Request Created!</h2>
        <p className="text-sm text-slate-400">
          <span className="text-white font-medium">{experimentName}</span> is ready. Add your preview URL below to see A/B live.
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
          compact={false}
        />
      )}

      {/* Open PR */}
      {prUrl && (
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 px-5 rounded-xl bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-colors font-medium"
        >
          <ExternalLink className="w-5 h-5 shrink-0" />
          Open Pull Request
        </a>
      )}

      {/* Preview URL */}
      <div className="glass-panel-vibe rounded-xl border border-primary/30 p-5 ring-1 ring-primary/10">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-white">Add Preview URL</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Deploy a preview (e.g. Vercel, Netlify), then paste the URL here. Control and Variant B will load with the right hashes.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={editPreviewUrl}
            onChange={(e) => setEditPreviewUrl(e.target.value)}
            placeholder="https://your-preview.vercel.app"
            className="flex-1 px-4 py-3 rounded-lg border border-white/10 bg-black/30 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono text-sm"
            disabled={savingPreview}
          />
          <button
            type="button"
            onClick={handleSavePreviewUrl}
            disabled={savingPreview || editPreviewUrl.trim() === (initialPreviewUrl ?? '')}
            className="px-5 py-3 rounded-lg bg-primary text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {savingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>

      {/* Continue */}
      <div className="mt-auto pt-4">
        <button
          onClick={() => onComplete(experimentId)}
          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
        >
          Continue
        </button>
        <p className="text-xs text-slate-500 text-center mt-2">
          Opens the experiment. You can add preview URL later too.
        </p>
      </div>
    </div>
  );
};
