import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AppBackgroundProps {
  children: ReactNode;
  className?: string;
  showScanline?: boolean;
}

export const AppBackground = ({
  children,
  className,
  showScanline = true,
}: AppBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative bg-background-dark text-slate-300 min-h-screen h-dvh md:h-screen overflow-x-hidden flex flex-col",
        className
      )}
    >
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[100px] mix-blend-screen" />
        {showScanline && <div className="absolute inset-0 scanline z-10 opacity-20" />}
      </div>
      {children}
    </div>
  );
};
