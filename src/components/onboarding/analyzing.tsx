"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import * as React from "react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

const STAGES = [
  { label: "Reading your answers", ms: 1600 },
  { label: "Working out your positioning", ms: 2000 },
  { label: "Studying the people you named", ms: 2400 },
  { label: "Building the four-week plan", ms: 2800 },
  { label: "Writing tomorrow's brief", ms: 2000 },
];

export interface AnalyzingProps {
  /** Flips true when the server work finishes. */
  done: boolean;
  onComplete: () => void;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * The stages are real work happening server-side, but the pacing is local —
 * the animation waits for `done` before the final stage completes, so it never
 * claims to be finished while the request is still in flight.
 */
export function Analyzing({ done, onComplete, error, onRetry }: AnalyzingProps) {
  const [stage, setStage] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (error) return;

    const isLast = stage === STAGES.length - 1;
    if (isLast && !done) return; // hold here until the server responds

    const duration = STAGES[stage]?.ms ?? 1500;
    const started = Date.now();

    const tick = window.setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - started) / duration) * 100));
    }, 60);

    const advance = window.setTimeout(() => {
      setProgress(0);
      if (isLast) onComplete();
      else setStage((value) => value + 1);
    }, duration);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(advance);
    };
  }, [stage, done, error, onComplete]);

  if (error) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-xl font-semibold text-ink">That did not go through</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-[var(--radius-sm)] border border-hairline px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-400"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="text-center text-xl font-semibold text-ink">Building your plan</h2>
      <p className="mt-2 text-center text-sm text-ink-muted">
        This takes a few seconds. Do not close the tab.
      </p>

      <ol className="mt-8 space-y-3">
        {STAGES.map((item, index) => {
          const complete = index < stage;
          const active = index === stage;

          return (
            <li key={item.label} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-300",
                  complete
                    ? "border-transparent [background:var(--gradient-success)]"
                    : active
                      ? "border-brand-400"
                      : "border-hairline",
                )}
              >
                <AnimatePresence>
                  {complete && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                      <Check aria-hidden className="size-3 text-white" strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <motion.span
                    className="size-1.5 rounded-full bg-brand-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm transition-colors duration-300",
                    complete ? "text-ink-muted" : active ? "font-medium text-ink" : "text-ink-muted/60",
                  )}
                >
                  {item.label}
                </p>
                {active && <ProgressBar value={progress} size="sm" className="mt-2" />}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
