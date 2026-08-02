"use client";

import { motion } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  /** Shared layoutId — keep unique when several Tabs render on one page. */
  layoutId?: string;
}

export function Tabs({ items, value, onValueChange, className, layoutId = "tab-indicator" }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-ink/[0.05] p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "relative rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors duration-150",
              active ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-0 rounded-[var(--radius-sm)] bg-surface shadow-[var(--shadow-sm)]"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {item.label}
              {typeof item.count === "number" && (
                <span className="font-mono text-[11px] tabular-nums text-ink-muted">{item.count}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
