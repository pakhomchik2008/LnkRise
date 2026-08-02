"use client";

import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { growthTier } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ProgressRing } from "./progress-ring";

const TIER_STOPS: Record<string, [string, string]> = {
  "Getting Started": ["#94a3b8", "#64748b"],
  "Building Momentum": ["#06b6d4", "#2b59ff"],
  Growing: ["#2b59ff", "#7c3aed"],
  Thriving: ["#7c3aed", "#ec4899"],
  Standout: ["#f97316", "#ec4899"],
};

export interface GrowthScoreProps {
  score: number;
  size?: number;
  className?: string;
  showTier?: boolean;
}

export function GrowthScore({ score, size = 180, className, showTier = true }: GrowthScoreProps) {
  const tier = growthTier(score);
  const animated = useAnimatedCounter(score, { duration: 1.4 });
  const [from, to] = TIER_STOPS[tier.label] ?? ["#2b59ff", "#7c3aed"];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <ProgressRing
        value={score}
        size={size}
        stroke={size > 140 ? 14 : 10}
        from={from}
        to={to}
        label={`Growth score ${score} out of 100 — ${tier.label}`}
      >
        <span className="font-mono text-4xl font-bold tabular-nums text-ink">{animated}</span>
        <span className="mt-0.5 text-[11px] font-medium tracking-wide text-ink-muted">
          GROWTH SCORE
        </span>
      </ProgressRing>

      {showTier && (
        <p className="mt-3 text-sm font-semibold text-ink">{tier.label}</p>
      )}
    </div>
  );
}
