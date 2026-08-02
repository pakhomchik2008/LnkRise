"use client";

import { motion } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import * as React from "react";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { useInView } from "@/hooks/use-in-view";
import { cn, formatNumber } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: number;
  trend?: number | null;
  series?: number[];
  index?: number;
  className?: string;
}

function Sparkline({ series }: { series: number[] }) {
  if (series.length < 2) return null;

  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = max - min || 1;
  const points = series
    .map((point, index) => {
      const x = (index / (series.length - 1)) * 100;
      const y = 24 - ((point - min) / range) * 22 - 1;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden className="h-6 w-full">
      <motion.polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </svg>
  );
}

export function StatCard({ label, value, trend, series, index = 0, className }: StatCardProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ amount: 0.4 });
  const animated = useAnimatedCounter(value, { start: inView });

  const TrendIcon = trend == null ? Minus : trend >= 0 ? TrendingUp : TrendingDown;
  const trendColor =
    trend == null ? "text-ink-muted" : trend >= 0 ? "text-accent-green" : "text-accent-orange";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "rounded-[var(--radius-md)] border border-hairline bg-surface p-4",
        "shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <p className="text-xs font-medium text-ink-muted">{label}</p>

      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold tabular-nums text-ink">
          {formatNumber(animated)}
        </span>
        <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", trendColor)}>
          <TrendIcon aria-hidden className="size-3.5" />
          {trend == null ? "—" : `${Math.abs(trend)}%`}
        </span>
      </div>

      {series && series.length > 1 && (
        <div className="mt-3 text-brand-500">
          <Sparkline series={series} />
        </div>
      )}
    </motion.div>
  );
}
