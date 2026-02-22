import { cn } from '@/lib/utils';

interface Segment {
  name: string;
  instructions?: string;
  percentage?: number;
}

interface SegmentSummaryCardsProps {
  control: Segment;
  variant: Segment;
  /** Compact: smaller text, less padding. Default true for sidebars */
  compact?: boolean;
  /** Show as inline row (side-by-side) or stacked */
  layout?: 'row' | 'stack';
}

const truncate = (s: string, len: number) =>
  (s?.trim() || '').length <= len ? (s?.trim() || '—') : (s?.trim() || '').slice(0, len).trim() + '…';

export const SegmentSummaryCards = ({
  control,
  variant,
  compact = true,
  layout = 'row',
}: SegmentSummaryCardsProps) => {
  const Card = ({
    type,
    label,
    instructions,
    pct,
  }: {
    type: 'control' | 'variant';
    label: string;
    instructions?: string;
    pct?: number;
  }) => (
    <div
      className={cn(
        'rounded-lg border overflow-hidden',
        layout === 'row' && 'flex-1 min-w-0',
        type === 'control'
          ? 'border-white/10 bg-slate-800/30'
          : 'border-primary/20 bg-primary/5'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          type === 'control' ? 'bg-black/20' : 'bg-primary/10',
          compact ? 'px-2 py-1' : 'px-3 py-2'
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase',
              type === 'control'
                ? 'bg-slate-700/50 text-slate-400'
                : 'bg-primary/30 text-primary'
            )}
          >
            {label}
          </span>
        </div>
        {pct != null && (
          <span
            className={cn(
              'font-mono text-[10px] shrink-0',
              type === 'control' ? 'text-slate-500' : 'text-primary'
            )}
          >
            {pct}%
          </span>
        )}
      </div>
      {(instructions?.trim() ?? '').length > 0 && (
        <p
          className={cn(
            'text-slate-400 leading-snug',
            compact ? 'px-2 py-1.5 text-[10px] line-clamp-1' : 'px-3 py-2 text-xs line-clamp-3'
          )}
          title={instructions?.trim()}
        >
          {truncate(instructions!.trim(), compact ? 60 : 100)}
        </p>
      )}
    </div>
  );

  const controlPct = control.percentage != null ? Math.round(control.percentage * 100) : undefined;
  const variantPct = variant.percentage != null ? Math.round(variant.percentage * 100) : undefined;

  return (
    <div
      className={cn(
        'flex gap-2',
        layout === 'stack' && 'flex-col'
      )}
    >
      <Card
        type="control"
        label={control.name || 'A'}
        instructions={control.instructions}
        pct={controlPct}
      />
      <Card
        type="variant"
        label={variant.name || 'B'}
        instructions={variant.instructions}
        pct={variantPct}
      />
    </div>
  );
};
