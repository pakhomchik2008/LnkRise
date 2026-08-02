"use client";

import { motion } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  /** Two-stop gradient applied to the arc. */
  from?: string;
  to?: string;
  trackClassName?: string;
  children?: React.ReactNode;
  className?: string;
  label?: string;
}

export function ProgressRing({
  value,
  size = 160,
  stroke = 12,
  from = "#2b59ff",
  to = "#7c3aed",
  trackClassName,
  children,
  className,
  label,
}: ProgressRingProps) {
  // Derived from the stops rather than useId() so server and client agree.
  const gradientId = `ring-${from.replace("#", "")}-${to.replace("#", "")}`;
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label ?? `${Math.round(clamped)} out of 100`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={cn("stroke-ink/[0.07]", trackClassName)}
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </svg>

      {children && <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>}
    </div>
  );
}
