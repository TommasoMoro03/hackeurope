import { cn } from "@/lib/utils";
import React from "react";

export const MovingBorder = ({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg p-[1px] bg-[length:200%_100%] animate-gradient",
        "bg-gradient-to-r from-primary via-primary-glow to-primary",
        className
      )}
    >
      <div className={cn("rounded-[inherit] bg-zinc-900", innerClassName)}>{children}</div>
    </div>
  );
};
