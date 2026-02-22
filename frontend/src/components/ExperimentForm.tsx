import { Button } from '@/components/Button';
import { useState } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { TrafficSplitSlider } from '@/components/TrafficSplitSlider';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

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
}

const DEFAULT_EXPERIMENT_NAME = 'New A/B Test';
const inputStyles =
  'w-full px-3 py-1.5 rounded border border-white/10 bg-black/30 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all font-mono text-xs';
const labelStyles = 'block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5';

export const ExperimentForm = ({ onSubmit, layout = 'default', percentageError: percentageErrorProp }: ExperimentFormProps) => {
  const [form, setForm] = useState<ExperimentFormData>({
    name: DEFAULT_EXPERIMENT_NAME,
    description: '',
    percentage: 100,
    numSegments: 2,
    metrics: '',
    preview_url: '',
    segments: [
      { name: 'Control', instructions: '', percentage: 0.5 },
      { name: 'Variant B', instructions: '', percentage: 0.5 },
    ],
  });
  const [percentageErrorInternal, setPercentageError] = useState<string | null>(null);
  const percentageError = percentageErrorProp ?? percentageErrorInternal;

  const handleSegmentChange = (index: number, field: 'name' | 'instructions' | 'percentage', value: string | number) => {
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
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div>
                <label className={labelStyles}>Experiment Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={cn(inputStyles, 'text-base font-semibold placeholder:text-slate-500')}
                  placeholder={DEFAULT_EXPERIMENT_NAME}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelStyles}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the experiment goals..."
                  className={cn(inputStyles, 'resize-none min-h-[4rem]')}
                  required
                />
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
                  value={form.metrics}
                  onChange={(e) => setForm({ ...form, metrics: e.target.value })}
                  rows={1}
                  placeholder="click_through_rate, signup_click"
                  className={cn(inputStyles, 'resize-none')}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelStyles}>
                  Preview URL <span className="text-slate-600 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={form.preview_url}
                  onChange={(e) => setForm({ ...form, preview_url: e.target.value })}
                  placeholder="https://your-app.com"
                  className={inputStyles}
                />
                <p className="text-[10px] text-slate-500">
                  URL of your deployed application for live preview (e.g., https://myapp.vercel.app)
                </p>
              </div>
            </div>
            <div className="p-3 border-t border-white/5 shrink-0">
              <Button type="submit" className="glow-button w-full py-2 text-xs flex items-center justify-center gap-2">
                <Sparkles className="w-3 h-3" />
                Create Experiment
              </Button>
            </div>
          </GlassPanel>
        </aside>

        {/* Right / Below: Two segment cards */}
        <main className={cn('flex min-w-0', isCardsLayout ? 'flex-col gap-4 md:flex-row' : 'flex-1 gap-4')}>
          {/* Control card */}
          <div className="flex-1 flex flex-col min-w-0">
            <GlassPanel title="Control" className="flex-1 flex flex-col overflow-hidden rounded-xl border-slate-700/50">
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <div>
                  <label className={labelStyles}>Segment Name</label>
                  <input
                    type="text"
                    value={form.segments[0]?.name ?? ''}
                    onChange={(e) => handleSegmentChange(0, 'name', e.target.value)}
                    className={inputStyles}
                    placeholder="Control / Baseline"
                    required
                  />
                </div>
                <div>
                  <label className={labelStyles}>Instructions for AI</label>
                  <textarea
                    value={form.segments[0]?.instructions ?? ''}
                    onChange={(e) => handleSegmentChange(0, 'instructions', e.target.value)}
                    rows={3}
                    placeholder="Keep original layout. No changes. Baseline for comparison."
                    className={cn(inputStyles, 'resize-none min-h-[4rem]')}
                    required
                  />
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Variant B card */}
          <div className="flex-1 flex flex-col min-w-0">
            <GlassPanel
              title="Variant B"
              className="flex-1 flex flex-col overflow-hidden rounded-xl border-primary/30 shadow-[0_0_30px_-5px_rgba(109,40,217,0.2)]"
            >
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <div>
                  <label className={labelStyles}>Segment Name</label>
                  <input
                    type="text"
                    value={form.segments[1]?.name ?? ''}
                    onChange={(e) => handleSegmentChange(1, 'name', e.target.value)}
                    className={inputStyles}
                    placeholder="Variant B / Treatment"
                    required
                  />
                </div>
                <div>
                  <label className={labelStyles}>Instructions for AI</label>
                  <textarea
                    value={form.segments[1]?.instructions ?? ''}
                    onChange={(e) => handleSegmentChange(1, 'instructions', e.target.value)}
                    rows={3}
                    placeholder="Increase CTA contrast. Make button larger. Add urgency."
                    className={cn(inputStyles, 'resize-none min-h-[4rem]')}
                    required
                  />
                </div>
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
