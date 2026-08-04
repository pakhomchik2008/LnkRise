"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GrowthScore } from "@/components/ui/growth-score";
import type { ProfileAnalysis, Strategy } from "@/types";

const ENTRANCE = { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } as const;

export interface ResultsProps {
  analysis: ProfileAnalysis;
  strategy: Strategy;
  onContinue: () => void;
}

/**
 * The one-time screen between "Building your plan" and the dashboard —
 * shows what the audit actually found before handing the user into the
 * day-to-day product, so the first thing they see isn't just an empty brief.
 */
export function Results({ analysis, strategy, onContinue }: ResultsProps) {
  return (
    <div className="mx-auto max-w-2xl py-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ENTRANCE}
        className="text-center"
      >
        <h1 className="text-2xl font-bold tracking-tight text-ink">Here&rsquo;s the read</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Everything below feeds the plan you are about to start.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...ENTRANCE, delay: 0.1 }}
        className="mt-8 flex justify-center"
      >
        <GrowthScore score={analysis.overallScore} size={160} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...ENTRANCE, delay: 0.18 }}
        className="mx-auto mt-6 max-w-lg text-center text-sm leading-relaxed text-ink"
      >
        {analysis.positioning}
      </motion.p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...ENTRANCE, delay: 0.24 }}
        >
          <Card className="h-full">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <Check aria-hidden className="size-3.5" />
              WORKING IN YOUR FAVOUR
            </p>
            <ul className="space-y-2">
              {analysis.strengths.map((strength) => (
                <li key={strength} className="text-sm leading-relaxed text-ink">
                  {strength}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...ENTRANCE, delay: 0.3 }}
        >
          <Card className="h-full">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-orange-700">
              <TrendingUp aria-hidden className="size-3.5" />
              WORTH FIXING FIRST
            </p>
            <ul className="space-y-2">
              {analysis.improvements.map((improvement) => (
                <li key={improvement} className="text-sm leading-relaxed text-ink">
                  {improvement}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...ENTRANCE, delay: 0.36 }}
        className="mt-4"
      >
        <Card>
          <p className="mb-4 text-xs font-semibold text-ink-muted">YOUR FOUR-WEEK PLAN</p>
          <ol className="space-y-4">
            {strategy.weeks.map((week) => (
              <li key={week.week} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-500/10 font-mono text-[11px] font-bold text-brand-600">
                  {week.week}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{week.theme}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{week.focus}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...ENTRANCE, delay: 0.42 }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <Badge tone="info">Today&rsquo;s brief is already waiting</Badge>
        <Button size="lg" icon={<ArrowRight className="size-4" />} iconPosition="right" onClick={onContinue}>
          Let&rsquo;s start growing
        </Button>
      </motion.div>
    </div>
  );
}
