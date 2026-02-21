"use client";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "absolute inset-0 z-0 flex h-full w-full items-center justify-center overflow-hidden bg-slate-950",
        className
      )}
    >
      <div className="absolute inset-0 bg-slate-950 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="absolute h-[150%] w-[150%] animate-[spin_10s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#020617_0%,#4b2bee_50%,#020617_100%)] opacity-20 transition-opacity duration-500"></div>
    </div>
  );
};
