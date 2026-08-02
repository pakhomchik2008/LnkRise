"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { StatPoint } from "@/types";

export function GrowthChart({ points }: { points: StatPoint[] }) {
  const data = points.map((point) => ({
    date: point.date.slice(5),
    views: point.profileViews,
    impressions: point.postImpressions,
  }));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>The last two weeks</CardTitle>
          <CardDescription>Profile views against post impressions</CardDescription>
        </div>
      </CardHeader>

      {data.length < 2 ? (
        <EmptyState
          title="Not enough data to draw a line"
          description="Two days of numbers and the chart appears — pulled, read by the extension, or typed. It is the only way to tell whether the plan is working rather than just feeling productive."
        />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="views-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2b59ff" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2b59ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="impressions-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
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
                dataKey="views"
                name="Profile views"
                stroke="#2b59ff"
                strokeWidth={2}
                fill="url(#views-fill)"
                animationDuration={900}
              />
              <Area
                type="monotone"
                dataKey="impressions"
                name="Impressions"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#impressions-fill)"
                animationDuration={900}
                animationBegin={150}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
