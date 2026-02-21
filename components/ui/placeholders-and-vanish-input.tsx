"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PlaceholdersAndVanishInputProps {
  placeholders: string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  value?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  value = "",
  disabled = false,
  className,
  inputClassName,
}: PlaceholdersAndVanishInputProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [vanishing, setVanishing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  // Cycle placeholders
  useEffect(() => {
    if (placeholders.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Pause placeholder cycle when tab hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && placeholders.length > 1) {
        setCurrentPlaceholder((prev) => prev);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [placeholders.length]);

  const runVanish = useCallback(
    (text: string, onComplete: () => void) => {
      const canvas = canvasRef.current;
      const input = inputRef.current;
      const container = containerRef.current;
      if (!canvas || !input || !container || !text.trim()) {
        onComplete();
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        onComplete();
        return;
      }

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const fontSize = 16;
      ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("color").trim() || "#171717";
      ctx.fillText(text, 20, 32);

      const imageData = ctx.getImageData(0, 0, rect.width * dpr, rect.height * dpr);
      const pixels: Particle[] = [];
      const gap = 4;

      for (let y = 0; y < imageData.height; y += gap) {
        for (let x = 0; x < imageData.width; x += gap) {
          const i = (y * imageData.width + x) * 4;
          const alpha = imageData.data[i + 3];
          if (alpha > 128) {
            pixels.push({
              x: x / dpr,
              y: y / dpr,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4 - 2,
              life: 1,
              color: `rgba(${imageData.data[i]},${imageData.data[i + 1]},${imageData.data[i + 2]},${alpha / 255})`,
            });
          }
        }
      }

      particlesRef.current = pixels;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const animate = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        let anyAlive = false;
        particlesRef.current = particlesRef.current.filter((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.1;
          p.life -= 0.015;
          if (p.life <= 0) return false;
          anyAlive = true;
          ctx.fillStyle = p.color.replace(/[\d.]+\)$/g, `${p.life})`);
          ctx.fillRect(p.x, p.y, 2, 2);
          return true;
        });
        if (anyAlive) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onComplete();
        }
      };
      animate();
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const text = inputRef.current?.value ?? (typeof value === "string" ? value : "");
      if (!text.trim() || disabled) return;
      setVanishing(true);
      runVanish(text, () => {
        setVanishing(false);
        onSubmit?.(e);
      });
    },
    [onSubmit, value, disabled, runVanish]
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
    >
      {vanishing && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
          style={{ left: 0, top: 0 }}
        />
      )}
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          disabled={disabled || vanishing}
          placeholder={placeholders[currentPlaceholder]}
          className={cn(
            "flex h-12 w-full rounded-xl border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-700 px-4 pr-24 text-base text-neutral-900 placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-400 shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-500 disabled:cursor-not-allowed disabled:opacity-50",
            inputClassName
          )}
        />
        <button
          type="submit"
          disabled={!value?.trim() || disabled || vanishing}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
