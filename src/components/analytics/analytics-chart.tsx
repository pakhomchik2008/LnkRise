"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import type { StatPoint } from "@/types";

const METRICS = [
  { value: "profileViews", label: "Profile views" },
  { value: "postImpressions", label: "Impressions" },
  { value: "followers", label: "Followers" },
  { value: "connections", label: "Connections" },
] as const;

type MetricKey = (typeof METRICS)[number]["value"];

export function AnalyticsChart({ points }: { points: StatPoint[] }) {
  const [metric, setMetric] = React.useState<MetricKey>("profileViews");

  const data = points.map((point) => ({
    date: point.date.slice(5),
    value: point[metric],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend</CardTitle>
        <Tabs
          items={METRICS as unknown as { value: string; label: string }[]}
          value={metric}
          onValueChange={(value) => setMetric(value as MetricKey)}
          layoutId="analytics-metric"
        />
      </CardHeader>

      {data.length < 2 ? (
        <EmptyState
          title="Not enough data to draw a line"
          description="Two days of numbers and the chart appears."
        />
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="metric-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2b59ff" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2b59ff" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-hairline)",
                  fontSize: 12,
                  boxShadow: "var(--shadow-md)",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                name={METRICS.find((item) => item.value === metric)?.label}
                stroke="#2b59ff"
                strokeWidth={2}
                fill="url(#metric-fill)"
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
