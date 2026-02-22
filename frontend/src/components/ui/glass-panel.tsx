import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  showChrome?: boolean;
  titleOnLeft?: boolean; // A/B cards: quiet label top-left
}

export const GlassPanel = ({
  children,
  className,
  title = "auth",
  showChrome = true,
  titleOnLeft = false,
}: GlassPanelProps) => {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl overflow-hidden relative group",
        className
      )}
    >
      {showChrome && (
        <div className="bg-black/40 px-4 py-3 flex items-center justify-between border-b border-white/5">
          {titleOnLeft ? (
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">{title}</div>
          ) : null}
          <div className="flex gap-2">
            <div className="size-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="size-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="size-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
          </div>
          {!titleOnLeft && (
            <div className="text-[10px] uppercase tracking-widest text-slate-600 font-mono">{title}</div>
          )}
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
};
