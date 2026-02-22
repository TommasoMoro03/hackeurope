import { useState, useRef, useCallback, useEffect } from 'react';

interface TrafficSplitSliderProps {
  aPercent: number;
  onSplitChange: (aPercent: number) => void;
  aLabel: string;
  bLabel: string;
  disabled?: boolean;
}

export function TrafficSplitSlider({
  aPercent,
  onSplitChange,
  aLabel,
  bLabel,
  disabled = false,
}: TrafficSplitSliderProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      if (!bar || disabled) return;
      const rect = bar.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      onSplitChange(pct);
    },
    [onSplitChange, disabled]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
    updateFromClientX(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateFromClientX(e.touches[0].clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => updateFromClientX(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      updateFromClientX(e.touches[0].clientX);
    };
    const handleEnd = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, updateFromClientX]);

  const bPercent = 100 - aPercent;

  return (
    <div className="space-y-1">
      <div
        ref={barRef}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={aPercent}
        aria-disabled={disabled}
        tabIndex={disabled ? undefined : 0}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={
          disabled
            ? undefined
            : (e) => {
                const step = e.shiftKey ? 10 : 5;
                if (e.key === 'ArrowLeft') onSplitChange(Math.max(0, aPercent - step));
                if (e.key === 'ArrowRight') onSplitChange(Math.min(100, aPercent + step));
              }
        }
        className={`relative h-10 rounded-lg overflow-hidden select-none flex ${
          disabled ? 'cursor-default opacity-75' : 'cursor-ew-resize'
        }`}
      >
        <div
          className="absolute inset-y-0 left-0 bg-slate-600/50 transition-colors"
          style={{ width: `${aPercent}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-primary/30 transition-colors"
          style={{ width: `${bPercent}%` }}
        />
        {!disabled && (
          <div
            className="absolute inset-y-0 w-2 -ml-1 bg-white/90 hover:bg-white cursor-ew-resize z-10 shadow-lg rounded-full pointer-events-none"
            style={{ left: `${aPercent}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>
          {aLabel} {Math.round(aPercent)}%
        </span>
        <span>
          {bLabel} {Math.round(bPercent)}%
        </span>
      </div>
    </div>
  );
}
