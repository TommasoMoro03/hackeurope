import { cn } from "@/lib/utils";
import React from "react";

export const MovingBorder = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg p-[1px] bg-[length:200%_100%] animate-gradient",
        "bg-gradient-to-r from-violet-500 via-cyan-500 to-violet-500",
        className
      )}
    >
      <div className="rounded-[inherit] bg-zinc-900">{children}</div>
    </div>
  );
};
