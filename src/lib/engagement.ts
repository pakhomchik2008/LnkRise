import "server-only";
import { engagementScore } from "@/lib/briefs";
import { prisma } from "@/lib/prisma";
import { toUtcDay } from "@/lib/utils";
import type { EngagementScore } from "@/types";

/**
 * Grades the user's previous day by pairing what they ticked off with what
 * their impressions actually did.
 *
 * Both analytics rows have to exist for the reach half to mean anything —
 * a delta against a missing day is not a small error, it is the whole number
 * being wrong — so anything less falls through to `unverified`, which the UI
 * renders as a warning rather than a score.
 */
export async function yesterdaysEngagement(userId: string, today: Date): Promise<EngagementScore> {
  const yesterday = toUtcDay(new Date(today.getTime() - 86_400_000));
  const dayBefore = toUtcDay(new Date(today.getTime() - 2 * 86_400_000));

  const brief = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: yesterday } },
    select: { id: true },
  });

  if (!brief) return { kind: "idle" };

  const [tasksTotal, tasksDone, snapshots] = await Promise.all([
    prisma.coachingTask.count({ where: { briefId: brief.id } }),
    prisma.coachingTask.count({ where: { briefId: brief.id, status: "completed" } }),
    prisma.analyticsSnapshot.findMany({
      where: { userId, date: { in: [yesterday, dayBefore] } },
      select: { date: true, postImpressions: true },
    }),
  ]);

  const time = (date: Date) => date.getTime();
  const yesterdayRow = snapshots.find((row) => time(row.date) === time(yesterday));
  const dayBeforeRow = snapshots.find((row) => time(row.date) === time(dayBefore));

  return engagementScore({
    tasksDone,
    tasksTotal,
    impressionsYesterday: yesterdayRow?.postImpressions ?? null,
    impressionsDayBefore: dayBeforeRow?.postImpressions ?? null,
    measuredOn: yesterdayRow ? yesterday.toISOString().slice(0, 10) : null,
  });
}
