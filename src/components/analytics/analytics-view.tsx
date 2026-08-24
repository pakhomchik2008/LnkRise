"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import * as React from "react";
import { buildSummaries } from "@/components/dashboard/stats-row";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { InsightsPanel } from "@/components/analytics/insights-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs } from "@/components/ui/tabs";
import type { StatPoint } from "@/types";

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

function sliceByRange(points: StatPoint[], days: number): StatPoint[] {
  if (days >= points.length) return points;
  return points.slice(-days);
}

export function AnalyticsView({
  points,
  postDates,
  unlocked,
}: {
  points: StatPoint[];
  postDates: string[];
  unlocked: boolean;
}) {
  const [range, setRange] = React.useState("7");

  const effectiveRange = unlocked ? range : "7";
  const days = Number(effectiveRange);
  const sliced = React.useMemo(() => sliceByRange(points, days), [points, days]);
  const summaries = React.useMemo(() => buildSummaries(sliced), [sliced]);
  const postsInRange = React.useMemo(() => {
    if (sliced.length === 0) return postDates.length;
    const earliest = sliced[0]!.date;
    return postDates.filter((date) => date >= earliest).length;
  }, [sliced, postDates]);

  if (points.length === 0) {
    return (
      <EmptyState
        title="Nothing logged yet"
        description="Log your numbers from the dashboard, or connect your account in settings to pull them automatically. Give it a few days and this page fills in."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          items={RANGES}
          value={effectiveRange}
          onValueChange={(value) => unlocked && setRange(value)}
          layoutId="analytics-range"
        />
        {!unlocked && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
            <Lock className="size-3.5" /> 30 and 90 days need Starter or Pro
          </span>
        )}
      </div>

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

      <AnalyticsChart points={sliced} />

      {unlocked ? (
        <InsightsPanel points={sliced} postsInRange={postsInRange} rangeDays={days} />
      ) : (
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <Lock className="size-5 text-ink-muted" />
          <div>
            <p className="text-sm font-semibold text-ink">
              Longer ranges and the read on what&apos;s working are a Starter feature
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              The trial shows the same seven days as your dashboard. Upgrading unlocks 30- and
              90-day ranges plus the insights panel below.
            </p>
          </div>
          <Link href="/pricing">
            <Button size="sm">See pricing</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
