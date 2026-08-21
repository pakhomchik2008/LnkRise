import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { Card } from "@/components/ui/card";
import { GrowthScore } from "@/components/ui/growth-score";
import { requireUserId } from "@/lib/auth";
import { PLAN_ACCESS, growthTier } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { PlanId, StatPoint } from "@/types";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

// Widest range the page offers. Capped rather than unbounded so a
// long-lived account can't turn this into an unbounded table scan.
const MAX_DAYS = 90;

export default async function AnalyticsPage() {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      growthScore: true,
      onboardedAt: true,
      subscription: { select: { plan: true } },
    },
  });

  if (!user) redirect("/login");
  if (!user.onboardedAt) redirect("/onboarding");

  const since = new Date(Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000);

  const [snapshots, publishedPosts] = await Promise.all([
    prisma.analyticsSnapshot.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "asc" },
      select: { date: true, profileViews: true, postImpressions: true, followers: true, connections: true },
    }),
    prisma.post.findMany({
      where: { userId, status: "published", publishedAt: { gte: since } },
      select: { publishedAt: true },
    }),
  ]);

  const points: StatPoint[] = snapshots.map((snapshot) => ({
    date: snapshot.date.toISOString().slice(0, 10),
    profileViews: snapshot.profileViews,
    postImpressions: snapshot.postImpressions,
    followers: snapshot.followers,
    connections: snapshot.connections,
  }));

  const postDates = publishedPosts
    .map((post) => post.publishedAt?.toISOString().slice(0, 10))
    .filter((date): date is string => Boolean(date));

  const plan = (user.subscription?.plan ?? "trial") as PlanId;
  const unlocked = PLAN_ACCESS[plan].analytics;
  const tier = growthTier(user.growthScore);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-ink-muted">
          What actually moved, over whichever window tells you something.
        </p>
      </header>

      <Card className="flex flex-col items-center gap-2 p-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4">
          <GrowthScore score={user.growthScore} size={88} showTier={false} />
          <div>
            <p className="text-lg font-semibold text-ink">{tier.label}</p>
            <p className="text-sm text-ink-muted">Growth score {user.growthScore} / 100</p>
          </div>
        </div>
      </Card>

      <AnalyticsView points={points} postDates={postDates} unlocked={unlocked} />
    </div>
  );
}
