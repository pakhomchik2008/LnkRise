"use client";

import { motion } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * The illustration is an abstract gradient composition rather than a stock
 * drawing — deliberately generic so it works on every empty screen.
 */
function EmptyIllustration() {
  return (
    <svg viewBox="0 0 120 90" aria-hidden className="h-24 w-32">
      <defs>
        <linearGradient id="empty-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2b59ff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="empty-b" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      <motion.rect
        x="14"
        y="30"
        width="34"
        height="46"
        rx="8"
        fill="url(#empty-a)"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 30, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
      <motion.rect
        x="54"
        y="14"
        width="34"
        height="62"
        rx="8"
        fill="url(#empty-b)"
        initial={{ y: 26, opacity: 0 }}
        animate={{ y: 14, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
      <motion.circle
        cx="97"
        cy="34"
        r="11"
        fill="url(#empty-a)"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </svg>
  );
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-lg)]",
        "border border-dashed border-hairline bg-surface-muted/50 px-6 py-12 text-center",
        className,
      )}
    >
      <EmptyIllustration />
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
