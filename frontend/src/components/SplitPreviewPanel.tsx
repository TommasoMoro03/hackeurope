import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Smartphone, Monitor, Sparkles, Loader2, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'mobile' | 'desktop';
type ExpandedPane = 'control' | 'variant' | null;

// Realistic viewport dimensions (CSS pixels)
const MOBILE_VIEWPORT = 390; // Modern smartphone (iPhone 14, Pixel 7)
const DESKTOP_IFRAME_WIDTH = 1440; // Laptop viewport (16:10)
const DESKTOP_IFRAME_HEIGHT = 900;
const DESKTOP_PANE_DISPLAY = 420; // Display width — larger for readability, fits two side-by-side
const MOBILE_IFRAME_HEIGHT = 844;

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
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');
  const [expanded, setExpanded] = useState<ExpandedPane>(null);

  const controlSrc = controlUrl?.trim() || undefined;
  const variantSrc = variantUrl?.trim() || undefined;

  const desktopScale = DESKTOP_PANE_DISPLAY / DESKTOP_IFRAME_WIDTH;
  const paneWidth = viewMode === 'mobile' ? MOBILE_VIEWPORT : DESKTOP_PANE_DISPLAY;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(null);
    };
    if (expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

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
      className="flex flex-col min-w-0 flex-1"
      style={{
        maxWidth: viewMode === 'desktop' ? DESKTOP_PANE_DISPLAY : undefined,
        flex: viewMode === 'desktop' ? `0 0 ${DESKTOP_PANE_DISPLAY}px` : undefined,
      }}
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
          'overflow-hidden relative bg-[#0e0c1a] min-w-0 transition-shadow',
          viewMode === 'mobile' && 'min-h-[280px] flex-1',
          viewMode === 'desktop' && 'aspect-[16/10]',
          viewMode === 'mobile'
            ? 'rounded-[1.75rem] border-8 border-zinc-800/90 shadow-xl'
            : 'rounded-xl',
          viewMode !== 'mobile' && type === 'control' && 'border border-white/10',
          viewMode !== 'mobile' && type === 'variant' && 'border border-primary/30 shadow-[0_0_50px_rgba(109,40,217,0.15)]'
        )}
        style={{
          width: paneWidth,
          minWidth: 0,
          maxWidth: '100%',
          flexShrink: viewMode === 'desktop' ? 0 : undefined,
        }}
      >
        <div
          className={cn(
            'absolute inset-x-0 top-0 flex items-center px-3 gap-2 z-10',
            viewMode === 'mobile' ? 'h-8' : 'h-6',
            type === 'control'
              ? 'bg-[#1a1829] border-b border-white/5'
              : 'bg-[#1a1829] border-b border-primary/20'
          )}
        >
          <div className={cn('flex gap-1.5', viewMode === 'desktop' && 'gap-1')}>
            <div
              className={cn(
                'rounded-full',
                viewMode === 'mobile' ? 'size-2.5' : 'size-2',
                type === 'control' ? 'bg-red-500/20' : 'bg-white/10'
              )}
            />
            <div
              className={cn(
                'rounded-full',
                viewMode === 'mobile' ? 'size-2.5' : 'size-2',
                type === 'control' ? 'bg-amber-500/20' : 'bg-white/10'
              )}
            />
            <div
              className={cn(
                'rounded-full',
                viewMode === 'mobile' ? 'size-2.5' : 'size-2',
                type === 'control' ? 'bg-emerald-500/20' : 'bg-white/10'
              )}
            />
          </div>
          <div
            className={cn(
              'mx-auto flex-1 max-w-[200px] rounded flex items-center justify-center font-mono truncate',
              viewMode === 'mobile' ? 'h-4 text-[8px]' : 'h-3 text-[7px]',
              type === 'control'
                ? 'bg-black/20 text-slate-600'
                : 'bg-primary/10 border border-primary/20 text-primary/70'
            )}
          >
            {isLoading || !hasData ? (type === 'control' ? '—' : '—') : (src || '—')}
          </div>
        </div>
        <div className={cn('absolute inset-0 overflow-hidden', viewMode === 'mobile' ? 'top-8' : 'top-6')}>
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
            viewMode === 'desktop' ? (
              <div
                className="absolute top-0 left-0"
                style={{
                  width: DESKTOP_IFRAME_WIDTH,
                  height: DESKTOP_IFRAME_HEIGHT,
                  transform: `scale(${desktopScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <iframe
                  src={src}
                  title={type === 'control' ? 'Control' : 'Variant B'}
                  className="border-0"
                  sandbox="allow-scripts allow-same-origin"
                  referrerPolicy="no-referrer"
                  style={{ width: DESKTOP_IFRAME_WIDTH, height: DESKTOP_IFRAME_HEIGHT }}
                />
              </div>
            ) : (
              <iframe
                src={src}
                title={type === 'control' ? 'Control' : 'Variant B'}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                referrerPolicy="no-referrer"
              />
            )
          ) : null}
        </div>
        {hasData && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(type); }}
            className="absolute bottom-3 right-3 z-20 p-2 rounded-lg bg-black/60 hover:bg-primary/80 text-white/80 hover:text-white transition-all duration-200 hover:scale-110 shadow-lg"
            title="Expand preview"
            aria-label="Expand preview"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  const expandedSrc = expanded === 'control' ? controlSrc : expanded === 'variant' ? variantSrc : undefined;
  const expandedLabel = expanded === 'control' ? controlLabel : expanded === 'variant' ? variantLabel : '';
  const expandedType = expanded;

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
      <AnimatePresence mode="wait">
        {expanded && expandedSrc && (
          <motion.div
            key="expand-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-[90]"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setExpanded(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              aria-hidden
            />
            <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'pointer-events-auto flex flex-col relative overflow-hidden bg-[#0e0c1a]',
                  viewMode === 'mobile'
                    ? 'rounded-[2rem] border-[10px] border-zinc-800 shadow-2xl'
                    : cn(
                        'rounded-2xl',
                        expandedType === 'control' ? 'border border-white/20' : 'border border-primary/40 shadow-[0_0_80px_rgba(109,40,217,0.3)]'
                      )
                )}
                style={
                  viewMode === 'mobile'
                    ? {
                        width: MOBILE_VIEWPORT,
                        maxWidth: '95vw',
                        height: MOBILE_IFRAME_HEIGHT,
                        maxHeight: '85vh',
                      }
                    : {
                        width: Math.min(DESKTOP_IFRAME_WIDTH, 1440),
                        maxWidth: '95vw',
                        height: Math.min(DESKTOP_IFRAME_HEIGHT, 900),
                        maxHeight: '85vh',
                      }
                }
              >
                <div
                  className={cn(
                    'flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0',
                    expandedType === 'control' ? 'border-white/10 bg-[#1a1829]' : 'border-primary/20 bg-[#1a1829]'
                  )}
                >
                  <span className="text-sm font-medium text-white truncate">{expandedLabel}</span>
                  <span className="text-xs text-slate-500 font-mono truncate flex-1 min-w-0 mx-2">{expandedSrc}</span>
                  <button
                    onClick={() => setExpanded(null)}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 min-h-0 relative bg-[#0e0c1a]">
                  <iframe
                    src={expandedSrc}
                    title={expandedLabel}
                    className="absolute inset-0 w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    referrerPolicy="no-referrer"
                    style={
                      viewMode === 'mobile'
                        ? { width: MOBILE_VIEWPORT, height: '100%' }
                        : { width: '100%', height: '100%' }
                    }
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'live' && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">View:</span>
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
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
              {viewMode === 'mobile' ? `${MOBILE_VIEWPORT}×844` : `${DESKTOP_IFRAME_WIDTH}×${DESKTOP_IFRAME_HEIGHT}`} • expand icon to enlarge
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Live Preview
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 flex gap-4 min-h-0 min-w-0 overflow-x-auto justify-center">
        <PreviewPane
          type="control"
          label={controlLabel}
          data={controlData}
          isLoading={mode === 'loading'}
          hasData={!!controlSrc}
          src={controlSrc}
        />

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
