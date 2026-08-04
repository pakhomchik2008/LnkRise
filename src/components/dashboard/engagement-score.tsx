"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { EngagementScore as EngagementScoreValue } from "@/types";

const ENTRANCE = { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } as const;

/**
 * How yesterday went.
 *
 * The `unverified` branch is deliberately styled as a warning rather than a
 * score. Task completion is self-reported, so on its own it measures effort
 * and nothing else — presenting it as a result would be the product lying to
 * the user about whether their work reached anyone. Red is the honest colour
 * for "we cannot tell you".
 */
export function EngagementScore({ value }: { value: EngagementScoreValue }) {
  if (value.kind === "idle") return null;

  if (value.kind === "unverified") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={ENTRANCE}>
        <Card className="border-red-500/30 bg-red-500/[0.04]">
          <div className="flex items-start gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-red-500/12">
              <AlertTriangle aria-hidden className="size-4 text-red-600" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink">Yesterday cannot be scored</p>
                <Badge tone="error" dot>
                  No data connected
                </Badge>
              </div>

              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                You ticked {value.tasksDone} of {value.tasksTotal} tasks, which tells us what you
                did — not whether it reached anyone. Ticking a box is self-reported; without your
                real numbers there is nothing here to analyse and we will not pretend otherwise.
              </p>

              <p className="mt-2 text-xs text-ink-muted">
                <Link href="/settings" className="font-medium text-red-700 underline underline-offset-2">
                  Connect your numbers
                </Link>{" "}
                — via the browser extension or by logging them by hand — and this becomes a real
                measurement.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  const rising = value.impressionsDelta >= 0;
  const Icon = rising ? TrendingUp : TrendingDown;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={ENTRANCE}>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-ink">Yesterday scored {value.score}</p>
              <Badge tone={rising ? "success" : "warning"} dot>
                Measured
              </Badge>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {value.tasksDone} of {value.tasksTotal} tasks done, and impressions{" "}
              {rising ? "rose" : "fell"} by {formatNumber(Math.abs(value.impressionsDelta))} against
              the day before.
            </p>
          </div>

          <div
            className={`flex items-center gap-1.5 text-sm font-semibold ${
              rising ? "text-emerald-700" : "text-orange-700"
            }`}
          >
            <Icon aria-hidden className="size-4" />
            {rising ? "+" : "−"}
            {formatNumber(Math.abs(value.impressionsDelta))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
