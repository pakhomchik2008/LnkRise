"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showValue?: boolean;
  gradient?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showValue = false,
  gradient = true,
  size = "md",
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label && <span className="text-xs font-medium text-ink-muted">{label}</span>}
          {showValue && (
            <span className="font-mono text-xs tabular-nums text-ink">{Math.round(clamped)}%</span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className={cn(
          "w-full overflow-hidden rounded-full bg-ink/[0.08]",
          size === "sm" ? "h-1.5" : "h-2.5",
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            "h-full rounded-full",
            gradient ? "[background:var(--gradient-primary)]" : "bg-brand-500",
          )}
        />
      </div>
    </div>
  );
}
