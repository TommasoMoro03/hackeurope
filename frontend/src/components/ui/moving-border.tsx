"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type MovingBorderButtonProps = {
  borderRadius?: string;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const MovingBorderButton = ({
  borderRadius = "1.75rem",
  containerClassName,
  borderClassName,
  duration = 2000,
  className,
  children,
  as: Component = "button",
  ...otherProps
}: MovingBorderButtonProps) => {
  return (
    <Component
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] p-[1px]",
        containerClassName
      )}
      {...otherProps}
    >
      <motion.div
        className={cn("absolute inset-0 rounded-[1.75rem]", borderClassName)}
        style={{
          background: "conic-gradient(#8b5cf6, #6d28d9, #8b5cf6, #6d28d9)",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: duration / 1000,
          repeat: Infinity,
          repeatType: "loop",
        }}
      />
      <div
        className={cn(
          "absolute inset-[1px] z-10 flex items-center justify-center rounded-[calc(1.75rem-1px)] bg-background-dark px-6 py-3 font-bold text-white",
          className
        )}
      >
        {children}
      </div>
    </Component>
  );
};
