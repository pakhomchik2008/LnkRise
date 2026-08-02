"use client";

import { motion } from "framer-motion";
import { Check, Flame, MessageSquare, PenLine, UserPlus } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";

const STATS = [
  { label: "Profile views", value: "1,284", trend: "+34%" },
  { label: "Impressions", value: "18.2K", trend: "+12%" },
  { label: "Followers", value: "2,140", trend: "+8%" },
  { label: "Connections", value: "947", trend: "+5%" },
];

const TASKS = [
  { icon: PenLine, label: "Publish the post on estimation debt", done: true },
  { icon: MessageSquare, label: "Reply to three posts about platform teams", done: true },
  { icon: UserPlus, label: "Send five connection requests to infra leads", done: false },
  { icon: Check, label: "Rewrite your headline as a claim", done: false },
];

const SPARK = [30, 44, 39, 58, 52, 71, 66, 84, 79, 96];

/**
 * A styled representation of the product, not a screenshot — it renders the
 * same components the real dashboard uses, with fixed sample numbers.
 */
export function DashboardMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl)] border border-hairline bg-surface shadow-[var(--shadow-lg)]",
        className,
      )}
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-hairline bg-surface-muted px-4 py-3">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 font-mono text-[11px] text-ink-muted">lnkrise.app/dashboard</span>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-hairline bg-surface-muted/60 p-6">
          <ProgressRing value={68} size={132} stroke={11} from="#2b59ff" to="#7c3aed" label="Growth score 68">
            <span className="font-mono text-3xl font-bold text-ink">68</span>
            <span className="text-[10px] font-medium tracking-wide text-ink-muted">GROWTH SCORE</span>
          </ProgressRing>
          <p className="mt-3 text-sm font-semibold text-ink">Thriving</p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-orange/12 px-2.5 py-1 text-xs font-semibold text-orange-700">
            <Flame className="size-3.5" />
            12-day streak
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-[var(--radius-md)] border border-hairline bg-surface p-3"
              >
                <p className="text-[11px] text-ink-muted">{stat.label}</p>
                <p className="mt-1 font-mono text-lg font-semibold text-ink">{stat.value}</p>
                <p className="text-[11px] font-medium text-accent-green">{stat.trend}</p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-[var(--radius-md)] border border-hairline bg-surface p-4">
            <p className="mb-3 text-xs font-semibold text-ink">Today&rsquo;s actions</p>
            <ul className="space-y-2">
              {TASKS.map((task, index) => (
                <motion.li
                  key={task.label}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.06 }}
                  className="flex items-center gap-2.5"
                >
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded border",
                      task.done
                        ? "border-transparent [background:var(--gradient-success)]"
                        : "border-hairline",
                    )}
                  >
                    {task.done && <Check className="size-2.5 text-white" strokeWidth={3} />}
                  </span>
                  <task.icon className="size-3.5 shrink-0 text-ink-muted" />
                  <span
                    className={cn(
                      "truncate text-xs",
                      task.done ? "text-ink-muted line-through" : "text-ink",
                    )}
                  >
                    {task.label}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="rounded-[var(--radius-md)] border border-hairline bg-surface p-4">
            <p className="mb-2 text-xs font-semibold text-ink">Last 10 days</p>
            <svg viewBox="0 0 200 44" preserveAspectRatio="none" className="h-11 w-full text-brand-500">
              <motion.polyline
                points={SPARK.map((point, index) => `${(index / (SPARK.length - 1)) * 200},${44 - (point / 100) * 40}`).join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
