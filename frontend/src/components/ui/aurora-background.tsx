import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col h-full items-center justify-center bg-zinc-900 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div
            className="absolute top-0 -left-4 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[128px] animate-blob"
            style={{ animation: "blob 7s infinite" }}
          />
          <div
            className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[128px] animate-blob"
            style={{ animation: "blob 7s infinite", animationDelay: "2s" }}
          />
          <div
            className="absolute -bottom-8 left-20 w-72 h-72 bg-amber-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-[128px] animate-blob"
            style={{ animation: "blob 7s infinite", animationDelay: "4s" }}
          />
        </div>
        {showRadialGradient && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.08),rgba(255,255,255,0))]" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.15),transparent_50%)]" />
      </div>
      {children}
    </div>
  );
};
