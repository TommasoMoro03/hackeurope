import { cn } from "@/lib/utils";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import React from "react";

export const CardHoverEffect = ({
  items,
  className,
}: {
  items: {
    title: string;
    description: string;
    link?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    [key: string]: any;
  }[];
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {items.map((item) => (
        <Card key={item.title} onClick={item.onClick}>
          {item.icon && <div className="mb-2">{item.icon}</div>}
          <h3 className="font-semibold text-white">{item.title}</h3>
          <p className="text-sm text-zinc-400">{item.description}</p>
        </Card>
      ))}
    </div>
  );
};

export const Card = ({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      style={{
        background: useMotionTemplate`
        radial-gradient(
          600px circle at ${mouseX}px ${mouseY}px,
          rgba(109, 40, 217, 0.2),
          transparent 40%
        )
      `,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative flex h-full w-full rounded-xl border border-white/10 bg-zinc-900/50 p-6 transition duration-200 hover:border-primary/50",
        "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="absolute inset-px rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-900 -z-0" />
      <div className="relative z-10 flex flex-col gap-4 min-h-full">{children}</div>
    </motion.div>
  );
};
