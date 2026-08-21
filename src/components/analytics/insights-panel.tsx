import { Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { percentChange } from "@/lib/utils";
import type { StatPoint } from "@/types";

const METRIC_LABELS: Record<keyof Omit<StatPoint, "date">, string> = {
  profileViews: "profile views",
  postImpressions: "impressions",
  followers: "followers",
  connections: "connections",
};

function buildInsights(points: StatPoint[], postsInRange: number, rangeDays: number): string[] {
  const insights: string[] = [];
  const first = points[0];
  const last = points.at(-1);

  if (first && last && points.length > 1) {
    const keys = Object.keys(METRIC_LABELS) as (keyof typeof METRIC_LABELS)[];
    const best = keys
      .map((key) => ({ key, change: percentChange(last[key], first[key]) }))
      .filter((entry): entry is { key: typeof entry.key; change: number } => entry.change !== null)
      .sort((a, b) => b.change - a.change)[0];

    if (best && best.change !== 0) {
      const direction = best.change > 0 ? "up" : "down";
      insights.push(
        `${METRIC_LABELS[best.key]} moved the most this period — ${direction} ${Math.abs(best.change)}%.`,
      );
    }
  }

  const loggedDays = points.length;
  insights.push(
    loggedDays >= rangeDays
      ? `Numbers logged every day this period — that's what makes the trend line mean something.`
      : `Logged ${loggedDays} of the last ${rangeDays} days. Gaps flatten the trend line into a guess.`,
  );

  insights.push(
    postsInRange === 0
      ? `No published posts in this window — the impressions line has nothing to explain a jump.`
      : `${postsInRange} post${postsInRange === 1 ? "" : "s"} published in this window.`,
  );

  return insights;
}

export function InsightsPanel({
  points,
  postsInRange,
  rangeDays,
}: {
  points: StatPoint[];
  postsInRange: number;
  rangeDays: number;
}) {
  const insights = buildInsights(points, postsInRange, rangeDays);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-1.5">
          <Sparkles className="size-4 text-brand-500" aria-hidden />
          What the numbers say
        </CardTitle>
      </CardHeader>

      <ul className="space-y-2.5">
        {insights.map((insight) => (
          <li key={insight} className="text-sm leading-relaxed text-ink-muted">
            {insight}
          </li>
        ))}
      </ul>
    </Card>
  );
}
