import { useState } from 'react';
import {
  SquareSplitHorizontal,
  Smartphone,
  Monitor,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'split' | 'mobile' | 'desktop';

interface SplitPreviewPanelProps {
  mode: 'loading' | 'live';
  controlLabel?: string;
  variantLabel?: string;
  controlUrl?: string;
  variantUrl?: string;
  controlData?: string;
  variantData?: string;
}

export const SplitPreviewPanel = ({
  mode,
  controlLabel = 'Original Baseline',
  variantLabel = 'AI Generated',
  controlUrl,
  variantUrl,
  controlData = 'CR: 2.4%',
  variantData = '+12.4% Lift',
}: SplitPreviewPanelProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  const controlSrc = controlUrl?.trim() || undefined;
  const variantSrc = variantUrl?.trim() || undefined;

  const previewWidth = viewMode === 'mobile' ? 375 : undefined;

  const PreviewPane = ({
    type,
    label,
    data,
    isLoading,
    hasData,
    src,
  }: {
    type: 'control' | 'variant';
    label: string;
    data: string;
    isLoading: boolean;
    hasData: boolean;
    src?: string;
  }) => (
    <div
      className={cn(
        'flex flex-col min-w-0 flex-1',
        viewMode === 'split' && 'flex-1'
      )}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1',
              type === 'control'
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-primary/20 text-primary border-primary/30'
            )}
          >
            {type === 'variant' && <Sparkles className="w-3 h-3" />}
            {type === 'control' ? 'CONTROL' : 'VARIANT B'}
          </span>
          <span
            className={cn(
              'text-sm font-medium',
              type === 'control' ? 'text-slate-300' : 'text-white'
            )}
          >
            {label}
          </span>
        </div>
        <span
          className={cn(
            'font-mono text-xs',
            type === 'control' ? 'text-slate-500' : 'text-emerald-400'
          )}
        >
          {data}
        </span>
      </div>
      <div
        className={cn(
          'flex-1 rounded-xl overflow-hidden relative bg-[#0e0c1a] min-h-[280px] min-w-0',
          type === 'control'
            ? 'border border-white/10'
            : 'border border-primary/30 shadow-[0_0_50px_rgba(109,40,217,0.15)]'
        )}
        style={previewWidth ? { width: previewWidth, maxWidth: previewWidth } : undefined}
      >
        <div
          className={cn(
            'absolute inset-x-0 top-0 h-8 flex items-center px-3 gap-2 z-10',
            type === 'control'
              ? 'bg-[#1a1829] border-b border-white/5'
              : 'bg-[#1a1829] border-b border-primary/20'
          )}
        >
          <div className="flex gap-1.5">
            <div
              className={cn(
                'size-2.5 rounded-full',
                type === 'control' ? 'bg-red-500/20' : 'bg-white/10'
              )}
            />
            <div
              className={cn(
                'size-2.5 rounded-full',
                type === 'control' ? 'bg-amber-500/20' : 'bg-white/10'
              )}
            />
            <div
              className={cn(
                'size-2.5 rounded-full',
                type === 'control' ? 'bg-emerald-500/20' : 'bg-white/10'
              )}
            />
          </div>
          <div
            className={cn(
              'mx-auto flex-1 max-w-[200px] h-4 rounded text-[8px] flex items-center justify-center font-mono truncate',
              type === 'control'
                ? 'bg-black/20 text-slate-600'
                : 'bg-primary/10 border border-primary/20 text-primary/70'
            )}
          >
            {isLoading || !hasData ? (type === 'control' ? '—' : '—') : (src || '—')}
          </div>
        </div>
        <div className="absolute inset-0 top-8">
          {isLoading || !hasData ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 bg-black/40">
              <Loader2 className="w-10 h-10 text-primary-glow animate-spin shrink-0" />
              <div className="w-full max-w-[200px] space-y-3 animate-pulse">
                <div className="h-3 bg-white/10 rounded w-full" />
                <div className="h-3 bg-white/10 rounded w-[85%]" />
                <div className="h-3 bg-white/10 rounded w-[70%]" />
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="h-16 bg-white/10 rounded" />
                  <div className="h-16 bg-white/10 rounded" />
                  <div className="h-16 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          ) : src ? (
            <iframe
              src={src}
              title={type === 'control' ? 'Control' : 'Variant B'}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
      {mode === 'live' && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">View:</span>
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setViewMode('split')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'split' ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5'
                )}
              >
                <SquareSplitHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5'
                )}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('desktop')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5'
                )}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Live Preview
          </span>
        </div>
      )}

      <div
        className={cn(
          'flex-1 flex gap-4 min-h-0',
          viewMode === 'mobile' && 'flex-col items-center'
        )}
      >
        <PreviewPane
          type="control"
          label={controlLabel}
          data={controlData}
          isLoading={mode === 'loading'}
          hasData={!!controlSrc}
          src={controlSrc}
        />

        {viewMode === 'split' && (
          <div className="w-px bg-gradient-to-b from-transparent via-white/10 to-transparent self-stretch shrink-0" />
        )}

        <PreviewPane
          type="variant"
          label={variantLabel}
          data={variantData}
          isLoading={mode === 'loading'}
          hasData={!!variantSrc}
          src={variantSrc}
        />
      </div>
    </div>
  );
};
