"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function PlatformSignupChart({ data }: { data: { date: string; count: number }[] }) {
  const total = data.reduce((sum, point) => sum + point.count, 0);

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/60">
        No signups in this window.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }}
            tickLine={false}
            axisLine={false}
            width={30}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#111827",
              color: "#fff",
              fontSize: 12,
            }}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />
          <Bar dataKey="count" fill="#2b59ff" radius={[3, 3, 0, 0]} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
