import { Button } from '@/components/Button';
import { useState } from 'react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { cn } from '@/lib/utils';

interface Segment {
  name: string;
  instructions: string;
  percentage: number;
}

interface ExperimentFormData {
  name: string;
  description: string;
  percentage: number;
  numSegments: number;
  metrics: string;
  segments: Segment[];
}

interface ExperimentFormProps {
  onSubmit: (data: ExperimentFormData) => void;
}

const inputStyles = 'w-full px-4 py-2.5 rounded-lg border border-white/10 bg-black/30 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all font-mono text-sm';
const labelStyles = 'block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2';

export const ExperimentForm = ({ onSubmit }: ExperimentFormProps) => {
  const [form, setForm] = useState<ExperimentFormData>({
    name: '',
    description: '',
    percentage: 100,
    numSegments: 2,
    metrics: '',
    segments: [
      { name: '', instructions: '', percentage: 0.5 },
      { name: '', instructions: '', percentage: 0.5 },
    ],
  });
  const [percentageError, setPercentageError] = useState<string | null>(null);

  const handleNumSegmentsChange = (num: number) => {
    const equalPercentage = 1 / num;
    const newSegments = Array.from({ length: num }, (_, i) =>
      form.segments[i] || { name: '', instructions: '', percentage: equalPercentage }
    );
    setForm({ ...form, numSegments: num, segments: newSegments });
    validatePercentages(newSegments);
  };

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
      setPercentageError(`Total must equal 100% (1.0). Current: ${(total * 100).toFixed(1)}%`);
      return false;
    } else {
      setPercentageError(null);
      return true;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePercentages(form.segments)) return;
    onSubmit(form);
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-serif font-bold text-white mb-6">Create New Experiment</h2>
      <GlassPanel title="experiment — create" className="overflow-visible">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className={labelStyles}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputStyles}
              required
            />
          </div>

          <div>
            <label className={labelStyles}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={cn(inputStyles, 'resize-none')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyles}>User coverage (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.percentage}
                onChange={(e) => setForm({ ...form, percentage: parseInt(e.target.value) })}
                className={inputStyles}
                required
              />
            </div>
            <div>
              <label className={labelStyles}>Segments</label>
              <input
                type="number"
                min="2"
                max="10"
                value={form.numSegments}
                onChange={(e) => handleNumSegmentsChange(parseInt(e.target.value))}
                className={inputStyles}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelStyles}>Metrics</label>
            <textarea
              value={form.metrics}
              onChange={(e) => setForm({ ...form, metrics: e.target.value })}
              rows={3}
              placeholder="Define metrics to track..."
              className={cn(inputStyles, 'resize-none')}
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400">Segments</h3>
            {percentageError && (
              <div className="glass-panel-vibe border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {percentageError}
              </div>
            )}
            {form.segments.map((segment, index) => (
              <div key={index} className="p-4 rounded-lg border border-white/5 bg-black/20 space-y-3">
                <h4 className="font-medium text-slate-300 font-mono text-sm">Segment {index + 1}</h4>
                <div className="space-y-3">
                  <div>
                    <label className={labelStyles}>Name</label>
                    <input
                      type="text"
                      value={segment.name}
                      onChange={(e) => handleSegmentChange(index, 'name', e.target.value)}
                      className={inputStyles}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Percentage (0.0–1.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={segment.percentage}
                      onChange={(e) => handleSegmentChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                      className={inputStyles}
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">{(segment.percentage * 100).toFixed(1)}% of users</p>
                  </div>
                  <div>
                    <label className={labelStyles}>Instructions</label>
                    <textarea
                      value={segment.instructions}
                      onChange={(e) => handleSegmentChange(index, 'instructions', e.target.value)}
                      rows={3}
                      className={cn(inputStyles, 'resize-none')}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" className="glow-button w-full sm:w-auto">
            Create Experiment
          </Button>
        </form>
      </GlassPanel>
    </div>
  );
};
