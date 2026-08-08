import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * When to post — from the user's own published posts if there are enough of
 * them to say anything, general LinkedIn guidance otherwise.
 *
 * The two states are never allowed to blur together. `measured` is built
 * from this account's own metrics; `general` is publicly known practice that
 * has nothing to do with this specific user, and the UI is required to label
 * it as such. Presenting the second as the first would be inventing a
 * personalized result from data that does not exist — the same failure the
 * engagement score was built to avoid.
 */

export type BestTime =
  | { kind: "measured"; label: string; detail: string; sampleSize: number }
  | { kind: "general"; label: string; detail: string };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Below this many published-with-metrics posts, a day/hour pattern is noise, not signal. */
const MIN_SAMPLE = 5;

// Publicly known LinkedIn practice, not this product's measurement of anything.
const GENERAL_GUIDANCE: BestTime = {
  kind: "general",
  label: "Tuesday–Thursday, 8–10am",
  detail:
    "General guidance, not your data — LinkedIn's own usage skews toward weekday mornings before the workday fills up. You do not have enough published posts yet for a recommendation built from your own numbers.",
};

export async function bestTimeToPost(userId: string): Promise<BestTime> {
  const posts = await prisma.post.findMany({
    // metrics is a Json column, so "has a value" is DbNull/JsonNull, not
    // plain null — see the same fix in the daily-brief cron.
    where: { userId, status: "published", metrics: { not: Prisma.JsonNull } },
    select: { publishedAt: true, metrics: true },
  });

  const scored = posts
    .map((post) => {
      const views = (post.metrics as { views?: number } | null)?.views;
      return post.publishedAt && typeof views === "number" ? { at: post.publishedAt, views } : null;
    })
    .filter((entry): entry is { at: Date; views: number } => entry !== null);

  if (scored.length < MIN_SAMPLE) return GENERAL_GUIDANCE;

  // Bucket by day-of-week + hour, weighted by views so one viral post does
  // not get diluted to the same weight as nine quiet ones.
  const buckets = new Map<string, { totalViews: number; count: number; day: number; hour: number }>();

  for (const entry of scored) {
    const day = entry.at.getUTCDay();
    const hour = entry.at.getUTCHours();
    const key = `${day}:${hour}`;
    const bucket = buckets.get(key) ?? { totalViews: 0, count: 0, day, hour };
    bucket.totalViews += entry.views;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  const best = [...buckets.values()].sort((a, b) => b.totalViews / b.count - a.totalViews / a.count)[0];
  if (!best) return GENERAL_GUIDANCE;

  const avgViews = Math.round(best.totalViews / best.count);

  return {
    kind: "measured",
    label: `${DAY_NAMES[best.day]}, ${String(best.hour).padStart(2, "0")}:00 UTC`,
    detail: `Built from your own ${scored.length} published posts. Your slot with the strongest average — ${avgViews.toLocaleString("en-US")} views across ${best.count} post${best.count === 1 ? "" : "s"} — outperformed the rest.`,
    sampleSize: scored.length,
  };
}
