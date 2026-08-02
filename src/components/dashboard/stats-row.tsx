"use client";

import { motion } from "framer-motion";
import * as React from "react";
import { logTodayStats } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import type { StatPoint, StatSummary } from "@/types";
import { percentChange } from "@/lib/utils";

const FIELDS = [
  { name: "profileViews", label: "Profile views" },
  { name: "postImpressions", label: "Post impressions" },
  { name: "followers", label: "Followers" },
  { name: "connections", label: "Connections" },
] as const;

export function buildSummaries(points: StatPoint[]): StatSummary[] {
  const latest = points.at(-1);
  const previous = points.at(-8) ?? points.at(0);

  return FIELDS.map((field) => ({
    label: field.label,
    value: latest?.[field.name] ?? 0,
    trend: previous && latest ? percentChange(latest[field.name], previous[field.name]) : null,
    series: points.map((point) => point[field.name]),
  }));
}

export function StatsRow({ points }: { points: StatPoint[] }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const summaries = React.useMemo(() => buildSummaries(points), [points]);
  const hasData = points.length > 0;

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await logTodayStats(formData);
    setPending(false);

    if (result.ok) {
      setOpen(false);
      toast({ tone: "success", title: "Logged", description: "Today's numbers are in." });
    } else {
      setError(result.error);
    }
  }

  return (
    <section aria-label="Your numbers">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Your numbers</h2>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Log today
        </Button>
      </div>

      {hasData ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summaries.map((summary, index) => (
            <StatCard
              key={summary.label}
              index={index}
              label={summary.label}
              value={summary.value}
              trend={summary.trend}
              series={summary.series}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[var(--radius-md)] border border-dashed border-hairline bg-surface-muted/50 p-5"
        >
          <p className="text-sm font-medium text-ink">No numbers logged yet</p>
          <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-ink-muted">
            Professional platforms do not expose personal analytics through a public API, so this is
            a thirty-second manual step. Log it daily and the charts fill in — and you get to see
            whether any of this is actually working.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setOpen(true)}>
            Log the first four numbers
          </Button>
        </motion.div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Log today's numbers"
        description="Copy them from your profile's analytics view. Whole numbers only."
      >
        <form action={onSubmit} className="space-y-3">
          {FIELDS.map((field) => (
            <Input
              key={field.name}
              name={field.name}
              label={field.label}
              type="number"
              min={0}
              step={1}
              defaultValue={0}
              required
            />
          ))}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
