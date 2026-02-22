import { useState, useRef, useEffect, useCallback } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { MovingBorder } from '@/components/ui/moving-border';
import { TrafficSplitSlider } from '@/components/TrafficSplitSlider';
import { cn } from '@/lib/utils';
import { Send, Pencil } from 'lucide-react';
import { api } from '@/lib/axios';

function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  useEffect(() => { resize(); }, [value, resize]);
  return { ref, onInput: resize };
}

interface Segment {
  name: string;
  instructions: string;
  percentage: number;
}

export interface ExperimentFormData {
  name: string;
  description: string;
  percentage: number;
  numSegments: number;
  metrics: string;
  preview_url: string;
  segments: Segment[];
}

interface ExperimentFormProps {
  onSubmit: (data: ExperimentFormData) => void;
  layout?: 'default' | 'cards';
  percentageError?: string | null;
  initialData?: Partial<ExperimentFormData>;
}

const DEFAULT_EXPERIMENT_NAME = 'New A/B Test';
const DEFAULT_A_INSTRUCTIONS = 'Keep original layout. No changes. Baseline for comparison.';
const DEFAULT_B_INSTRUCTIONS = 'Increase CTA contrast. Make button larger. Add urgency.';
const inputStyles =
  'w-full px-3 py-1.5 rounded border border-white/10 bg-black/30 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all font-mono text-xs';
const labelStyles = 'block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5';

export const ExperimentForm = ({ onSubmit, layout = 'default', percentageError: percentageErrorProp, initialData }: ExperimentFormProps) => {
  const descAutoResize   = useAutoResize(initialData?.description ?? '');
  const metricsAutoResize = useAutoResize(initialData?.metrics ?? '');
  const segAAutoResize   = useAutoResize(initialData?.segments?.[0]?.instructions ?? '');
  const segBAutoResize   = useAutoResize(initialData?.segments?.[1]?.instructions ?? '');

  const [form, setForm] = useState<ExperimentFormData>({
    name: initialData?.name || DEFAULT_EXPERIMENT_NAME,
    description: initialData?.description || '',
    percentage: initialData?.percentage || 100,
    numSegments: initialData?.numSegments || 2,
    metrics: initialData?.metrics || '',
    preview_url: initialData?.preview_url || '',
    segments: initialData?.segments || [
      { name: 'A', instructions: '', percentage: 0.5 },
      { name: 'B', instructions: '', percentage: 0.5 },
    ],
  });
  const [percentageErrorInternal, setPercentageError] = useState<string | null>(null);
  const percentageError = percentageErrorProp ?? percentageErrorInternal;
  const [isEditingName, setIsEditingName] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);

  const generateName = async () => {
    const desc = form.description.trim();
    const control = form.segments[0]?.instructions?.trim() ?? '';
    const variant = form.segments[1]?.instructions?.trim() ?? '';
    if (!desc && !control && !variant) return;
    // Only overwrite if name is still default (user hasn't customized)
    const nameIsDefault = !form.name.trim() || form.name.trim() === DEFAULT_EXPERIMENT_NAME;
    if (!nameIsDefault) return;

    setIsGeneratingName(true);
    try {
      const { data } = await api.post<{ name: string }>('/api/experiments/generate-name', {
        description: desc,
        control_instructions: control,
        variant_instructions: variant,
      });
      if (data?.name?.trim()) {
        setForm((prev) => ({ ...prev, name: data.name.trim() }));
      }
    } catch {
      // Fallback to default, no UX disruption
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handleSegmentChange = (index: number, field: 'instructions' | 'percentage', value: string | number) => {
    const newSegments = [...form.segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setForm({ ...form, segments: newSegments });
    if (field === 'percentage') {
      validatePercentages(newSegments);
    }
  };

  const validatePercentages = (segments: Segment[]) => {
    const total = segments.reduce((sum, seg) => sum + seg.percentage, 0);
    if (Math.abs(total - 1) > 0.001) {
      setPercentageError(`Total must equal 100%. Current: ${(total * 100).toFixed(1)}%`);
      return false;
    } else {
      setPercentageError(null);
      return true;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePercentages(form.segments)) return;
    const metricsText = form.metrics || 'click_through_rate';
    const nameToSubmit = form.name.trim() || DEFAULT_EXPERIMENT_NAME;
    onSubmit({ ...form, name: nameToSubmit, metrics: metricsText });
  };

  const isCardsLayout = layout === 'cards';

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <form onSubmit={handleSubmit} className={cn('flex-1 flex min-h-0 min-w-0', isCardsLayout ? 'flex-col gap-4' : 'gap-4')}>
        {/* Left / Top: Main config */}
        <aside className={isCardsLayout ? 'w-full' : 'w-72 shrink-0'}>
          <GlassPanel title="Test Configuration" className="flex flex-col h-full overflow-hidden rounded-xl">
            <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3">
              <div>
                <label className={labelStyles}>Experiment Name</label>
                {isEditingName ? (
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                    className={cn(inputStyles, 'text-base font-semibold placeholder:text-slate-500')}
                    placeholder={DEFAULT_EXPERIMENT_NAME}
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2 group">
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="text-left text-base font-semibold text-white flex-1 min-w-0 truncate hover:text-slate-300 transition-colors"
                    >
                      {form.name.trim() || DEFAULT_EXPERIMENT_NAME}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0"
                      aria-label="Edit experiment name"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className={labelStyles}>Description</label>
                <textarea
                  ref={descAutoResize.ref}
                  value={form.description}
                  onChange={(e) => { setForm({ ...form, description: e.target.value }); descAutoResize.onInput(); }}
                  onBlur={generateName}
                  placeholder="Describe the experiment goals..."
                  className={cn(inputStyles, 'resize-none min-h-[4rem] overflow-hidden')}
                  required
                />
                {isGeneratingName && (
                  <span className="text-[10px] text-slate-500">Generating name…</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className={labelStyles}>User Coverage (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.percentage}
                  onChange={(e) => setForm({ ...form, percentage: parseInt(e.target.value) || 0 })}
                  className={inputStyles}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelStyles}>Traffic split: drag between A and B</label>
                <TrafficSplitSlider
                  aPercent={(form.segments[0]?.percentage ?? 0.5) * 100}
                  onSplitChange={(aPercent) => {
                    const a = Math.max(0, Math.min(100, aPercent)) / 100;
                    const b = 1 - a;
                    const newSegments = [...form.segments];
                    newSegments[0] = { ...newSegments[0], percentage: a };
                    newSegments[1] = { ...newSegments[1], percentage: b };
                    setForm({ ...form, segments: newSegments });
                    validatePercentages(newSegments);
                  }}
                  aLabel={form.segments[0]?.name ?? 'A'}
                  bLabel={form.segments[1]?.name ?? 'B'}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelStyles}>Metrics to Track</label>
                <textarea
                  ref={metricsAutoResize.ref}
                  value={form.metrics}
                  onChange={(e) => { setForm({ ...form, metrics: e.target.value }); metricsAutoResize.onInput(); }}
                  placeholder="e.g. Proportion of clicks"
                  className={cn(inputStyles, 'resize-none min-h-[2rem] overflow-hidden')}
                />
              </div>

            </div>
            <div className="p-3 border-t border-white/5 shrink-0">
              <MovingBorder className="w-full" innerClassName="rounded-lg !bg-transparent p-0">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-medium text-white bg-primary hover:bg-primary-glow flex items-center justify-between transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Experiment
                  <Send className="w-3 h-3 shrink-0" />
                </button>
              </MovingBorder>
            </div>
          </GlassPanel>
        </aside>

        {/* Right / Below: Two segment cards - A/B watermark + instructions in same card */}
        <main className={cn('flex min-w-0', isCardsLayout ? 'flex-col gap-4 md:flex-row' : 'flex-1 gap-4')}>
          {/* A card */}
          <div className="flex-1 flex flex-col min-w-0">
            <GlassPanel showChrome={false} className="flex-1 flex flex-col overflow-hidden rounded-xl border-slate-700/50 relative">
              <button
                type="button"
                onClick={() => handleSegmentChange(0, 'instructions', DEFAULT_A_INSTRUCTIONS)}
                className="absolute top-2 left-3 text-[7rem] font-serif italic text-white/[0.07] leading-none select-none cursor-pointer hover:text-white/[0.12] transition-colors z-20"
                aria-label="Auto-fill A instructions"
              >
                A
              </button>
              <div className="flex-1 overflow-y-auto scrollbar-hide p-3 pt-20 relative z-10">
                <label className={labelStyles}>Instructions for AI</label>
                <textarea
                  ref={segAAutoResize.ref}
                  value={form.segments[0]?.instructions ?? ''}
                  onChange={(e) => { handleSegmentChange(0, 'instructions', e.target.value); segAAutoResize.onInput(); }}
                  onBlur={generateName}
                  placeholder={DEFAULT_A_INSTRUCTIONS}
                  className={cn(inputStyles, 'resize-none min-h-[4rem] overflow-hidden mt-1.5')}
                  required
                />
              </div>
            </GlassPanel>
          </div>

          {/* B card */}
          <div className="flex-1 flex flex-col min-w-0">
            <GlassPanel
              showChrome={false}
              className="flex-1 flex flex-col overflow-hidden rounded-xl border-primary/30 shadow-[0_0_30px_-5px_rgba(109,40,217,0.2)] relative"
            >
              <button
                type="button"
                onClick={() => handleSegmentChange(1, 'instructions', DEFAULT_B_INSTRUCTIONS)}
                className="absolute top-2 left-3 text-[7rem] font-serif italic text-primary/[0.1] leading-none select-none cursor-pointer hover:text-primary/[0.16] transition-colors z-20"
                aria-label="Auto-fill B instructions"
              >
                B
              </button>
              <div className="flex-1 overflow-y-auto scrollbar-hide p-3 pt-20 relative z-10">
                <label className={labelStyles}>Instructions for AI</label>
                <textarea
                  ref={segBAutoResize.ref}
                  value={form.segments[1]?.instructions ?? ''}
                  onChange={(e) => { handleSegmentChange(1, 'instructions', e.target.value); segBAutoResize.onInput(); }}
                  onBlur={generateName}
                  placeholder={DEFAULT_B_INSTRUCTIONS}
                  className={cn(inputStyles, 'resize-none min-h-[4rem] overflow-hidden mt-1.5')}
                  required
                />
              </div>
            </GlassPanel>
          </div>
        </main>
      </form>

      {percentageError && (
        <div className="mt-4 glass-panel-vibe border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {percentageError}
        </div>
      )}
    </div>
  );
};
