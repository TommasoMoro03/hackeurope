import { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { cn } from '@/lib/utils';
import { api } from '@/lib/axios';

interface Segment {
  id: number;
  name: string;
  instructions: string;
  percentage: number;
}

interface Experiment {
  id: number;
  name: string;
  description: string;
  status: string;
  percentage: number;
  metrics: string;
  preview_url?: string;
  segments: Segment[];
  created_at: string;
}

interface ExperimentDetailsCardsProps {
  experiment: Experiment;
  onExperimentUpdate?: (updates: Partial<Experiment>) => void;
  onFinish?: () => void;
}

export const ExperimentDetailsCards = ({
  experiment,
  onExperimentUpdate,
  onFinish,
}: ExperimentDetailsCardsProps) => {
  const [showUrlPopup, setShowUrlPopup] = useState(false);
  const [editUrl, setEditUrl] = useState(experiment.preview_url ?? '');
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    setEditUrl(experiment.preview_url ?? '');
  }, [experiment.preview_url]);

  const openUrlPopup = () => {
    setEditUrl(experiment.preview_url ?? '');
    setUrlError(null);
    setShowUrlPopup(true);
  };

  const handleSavePreviewUrl = async () => {
    setUrlError(null);
    setSavingUrl(true);
    try {
      await api.patch(`/api/experiments/${experiment.id}/preview-url`, {
        preview_url: editUrl.trim() || null,
      });
      onExperimentUpdate?.({ preview_url: editUrl.trim() || undefined });
      setShowUrlPopup(false);
    } catch (err: any) {
      setUrlError(err.response?.data?.detail ?? 'Failed to update preview URL');
    } finally {
      setSavingUrl(false);
    }
  };

  const controlSegment = experiment.segments[0];
  const variantSegment = experiment.segments[1];

  return (
    <>
      {/* Config card - matches Test Configuration during create */}
      <GlassPanel title="Test Configuration" className="rounded-xl">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white truncate">{experiment.name}</h3>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-mono uppercase shrink-0',
                experiment.status === 'active' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
                experiment.status === 'paused' && 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                !['active', 'paused'].includes(experiment.status) && 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
              )}
            >
              {experiment.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2">{experiment.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase">Preview URL</span>
            <span className="text-xs text-slate-400 truncate flex-1">
              {experiment.preview_url || 'Not set'}
            </span>
            <button
              type="button"
              onClick={openUrlPopup}
              className="p-1 text-slate-400 hover:text-slate-300 rounded shrink-0"
              title="Edit preview URL"
              aria-label="Edit preview URL"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg border border-white/5 bg-black/20">
              <p className="text-[10px] text-slate-500">Coverage</p>
              <p className="text-lg font-bold text-white">{experiment.percentage}%</p>
            </div>
            <div className="p-2 rounded-lg border border-white/5 bg-black/20">
              <p className="text-[10px] text-slate-500">Metrics</p>
              <p className="text-xs text-white font-mono truncate" title={experiment.metrics}>
                {experiment.metrics || '—'}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Created {new Date(experiment.created_at).toLocaleDateString()}
          </p>
          {experiment.status === 'active' && onFinish && (
            <button
              type="button"
              onClick={onFinish}
              className="w-full mt-3 py-2 px-3 rounded-lg bg-primary hover:bg-primary-glow text-white text-xs font-medium transition-colors"
            >
              Finish Experiment
            </button>
          )}
          {experiment.status === 'finished' && (
            <span className="block mt-3 py-2 text-center rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
              Experiment Finished
            </span>
          )}
        </div>
      </GlassPanel>

      {/* Segments: A % | B % — minimal */}
      <div className="grid grid-cols-2 gap-1.5">
        <div
          className="rounded-lg border border-white/5 bg-black/20 px-2.5 py-2"
          title={controlSegment?.instructions}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-slate-500">A</span>
            <span className="text-sm font-mono text-white tabular-nums">
              {((controlSegment?.percentage ?? 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div
          className="rounded-lg border border-primary/20 bg-black/20 px-2.5 py-2"
          title={variantSegment?.instructions}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-slate-500">B</span>
            <span className="text-sm font-mono text-primary-glow tabular-nums">
              {((variantSegment?.percentage ?? 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {showUrlPopup && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => !savingUrl && setShowUrlPopup(false)}
            aria-hidden
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-zinc-900 rounded-lg shadow-lg border border-white/10 p-4">
            <p className="text-sm font-medium text-slate-300 mb-2">Preview URL</p>
            <input
              type="url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowUrlPopup(false);
              }}
            />
            {urlError && (
              <p className="mt-1 text-xs text-red-400">{urlError}</p>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !savingUrl && setShowUrlPopup(false)}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePreviewUrl}
                disabled={savingUrl}
                className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:opacity-90 disabled:opacity-50"
              >
                {savingUrl ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
