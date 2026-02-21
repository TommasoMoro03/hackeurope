import { useState } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import {
  SquareSplitHorizontal,
  Smartphone,
  Monitor,
  Sparkles,
  Target,
  Palette,
  Zap,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExperimentLivePreviewProps {
  experiment: { id: number; name: string; segments: { id: number; name: string }[] };
  project?: { github_url: string };
}

type ViewMode = 'split' | 'mobile' | 'desktop';

const PreviewSkeleton = () => (
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
);

export const ExperimentLivePreview = ({ experiment }: ExperimentLivePreviewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [controlUrl, setControlUrl] = useState('');
  const [variantUrl, setVariantUrl] = useState('');
  const [designPrompt, setDesignPrompt] = useState('');
  const [creativity, setCreativity] = useState(85);
  const [layoutShift, setLayoutShift] = useState(40);
  const [optimizationGoal, setOptimizationGoal] = useState<'ctr' | 'revenue'>('ctr');

  const controlSrc = controlUrl.trim() || undefined;
  const variantSrc = variantUrl.trim() || undefined;

  const getPreviewWidth = () => {
    if (viewMode === 'split') return undefined;
    if (viewMode === 'mobile') return 375;
    return undefined; // desktop = full
  };
  const previewWidth = getPreviewWidth();

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left: Test Configuration */}
      <aside className="w-80 shrink-0 flex flex-col border-r border-white/5">
        <GlassPanel title="Test Configuration" className="flex-1 flex flex-col m-4 mr-0 overflow-hidden rounded-xl">
          <div className="p-4 border-b border-white/5">
            <p className="text-xs text-slate-500">Define parameters for AI generation</p>
            <p className="text-[10px] text-slate-600 mt-1 font-mono">{experiment.name}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Preview URLs */}
            <div className="space-y-3">
              <label className="text-xs font-mono text-slate-400 uppercase block">Preview URLs</label>
              <input
                type="url"
                placeholder="Control URL (original)"
                value={controlUrl}
                onChange={(e) => setControlUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono"
              />
              <input
                type="url"
                placeholder="Variant URL (optional)"
                value={variantUrl}
                onChange={(e) => setVariantUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono"
              />
              <p className="text-[10px] text-slate-600">Enter your preview URL to see live content</p>
            </div>

            {/* Optimization Goal */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase block">Optimization Goal</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOptimizationGoal('ctr')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all',
                    optimizationGoal === 'ctr'
                      ? 'bg-primary/20 border-primary/50 text-white'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  )}
                >
                  <Target className="w-4 h-4" />
                  CTR Max
                </button>
                <button
                  onClick={() => setOptimizationGoal('revenue')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all',
                    optimizationGoal === 'revenue'
                      ? 'bg-primary/20 border-primary/50 text-white'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  Revenue
                </button>
              </div>
            </div>

            {/* Design Prompt */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-mono text-slate-400 uppercase">Design Prompt</label>
                <span className="text-[10px] text-primary-glow font-mono animate-pulse">AI Listening...</span>
              </div>
              <textarea
                value={designPrompt}
                onChange={(e) => setDesignPrompt(e.target.value)}
                placeholder="Make the layout more aggressive with higher contrast. Emphasize the CTA..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-slate-200 text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none font-mono"
              />
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Creativity</span>
                  <span className="text-white font-mono">{creativity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={creativity}
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-glow"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Layout Shift</span>
                  <span className="text-white font-mono">{layoutShift}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layoutShift}
                  onChange={(e) => setLayoutShift(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
              </div>
            </div>

            {/* Active Constraints */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase block">Active Constraints</label>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  Brand Colors
                </span>
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Mobile First
                </span>
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  &lt;1.2s LCP
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-white/5">
            <button className="w-full py-3 bg-primary hover:bg-primary-glow rounded-lg text-sm font-bold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Variation
            </button>
          </div>
        </GlassPanel>
      </aside>

      {/* Right: Split View */}
      <main className="flex-1 flex flex-col min-w-0 p-4 overflow-hidden">
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">
              {viewMode === 'mobile' ? '375' : viewMode === 'desktop' ? '1920' : '1920'} × 1080
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Live Preview
            </span>
          </div>
        </div>

        <div
          className={cn(
            'flex-1 flex gap-4 min-h-0',
            viewMode === 'mobile' && 'flex-col items-center'
          )}
        >
          {/* Control (Original) */}
          <div
            className={cn(
              'flex flex-col min-w-0',
              viewMode === 'split' ? 'flex-1' : 'flex-1'
            )}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                  CONTROL
                </span>
                <span className="text-sm font-medium text-slate-300">Original Baseline</span>
              </div>
              <span className="font-mono text-xs text-slate-500">CR: 2.4%</span>
            </div>
            <div
              className="flex-1 rounded-xl border border-white/10 overflow-hidden relative bg-[#0e0c1a] min-h-[300px] min-w-0"
              style={previewWidth ? { width: previewWidth, maxWidth: previewWidth } : undefined}
            >
              <div className="absolute inset-x-0 top-0 h-8 bg-[#1a1829] border-b border-white/5 flex items-center px-3 gap-2 z-10">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-red-500/20" />
                  <div className="size-2.5 rounded-full bg-amber-500/20" />
                  <div className="size-2.5 rounded-full bg-emerald-500/20" />
                </div>
                <div className="mx-auto flex-1 max-w-[200px] h-4 bg-black/20 rounded text-[8px] flex items-center justify-center text-slate-600 font-mono truncate">
                  {controlSrc || '—'}
                </div>
              </div>
              <div className="absolute inset-0 top-8">
                {controlSrc ? (
                  <iframe
                    src={controlSrc}
                    title="Control variant"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <PreviewSkeleton />
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          {viewMode === 'split' && (
            <div className="w-px bg-gradient-to-b from-transparent via-white/10 to-transparent self-stretch shrink-0" />
          )}

          {/* Variant B */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary/20 text-[10px] font-mono text-primary border border-primary/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  VARIANT B
                </span>
                <span className="text-sm font-medium text-white">AI Generated</span>
              </div>
              <span className="font-mono text-xs text-emerald-400">+12.4% Lift</span>
            </div>
            <div
              className="flex-1 rounded-xl border border-primary/30 overflow-hidden relative bg-[#0e0c1a] shadow-[0_0_50px_rgba(109,40,217,0.15)] min-h-[300px] min-w-0"
              style={previewWidth ? { width: previewWidth, maxWidth: previewWidth } : undefined}
            >
              <div className="absolute inset-x-0 top-0 h-8 bg-[#1a1829] border-b border-primary/20 flex items-center px-3 gap-2 z-10">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-white/10" />
                  <div className="size-2.5 rounded-full bg-white/10" />
                  <div className="size-2.5 rounded-full bg-white/10" />
                </div>
                <div className="mx-auto flex-1 max-w-[200px] h-4 bg-primary/10 border border-primary/20 rounded text-[8px] flex items-center justify-center text-primary/70 font-mono truncate">
                  {variantSrc || '—'}
                </div>
              </div>
              <div className="absolute inset-0 top-8">
                {variantSrc ? (
                  <iframe
                    src={variantSrc}
                    title="Variant B"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <PreviewSkeleton />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2 text-[10px] text-slate-500 font-mono">
          <span>Processing: 14ms</span>
          <span>|</span>
          <span>Token Usage: 450</span>
          <span>|</span>
          <span>Model: Vibe-LLM-v2</span>
        </div>
      </main>
    </div>
  );
};
