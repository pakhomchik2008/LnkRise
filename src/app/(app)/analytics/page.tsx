import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { Card } from "@/components/ui/card";
import { GrowthScore } from "@/components/ui/growth-score";
import { requireUserId } from "@/lib/auth";
import { GROWTH_TIERS, PLAN_ACCESS, growthTier } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { PlanId, StatPoint } from "@/types";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

// Widest range the page offers. Capped rather than unbounded so a
// long-lived account can't turn this into an unbounded table scan.
const MAX_DAYS = 90;
const TRIAL_DAYS = 7;

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

  const plan = (user.subscription?.plan ?? "trial") as PlanId;
  const unlocked = PLAN_ACCESS[plan].analytics;

  // The window is enforced on the server so a locked user cannot read the
  // extra days out of the RSC payload — the client toggle only decides what
  // the user sees within what the server chose to hand out.
  const windowDays = unlocked ? MAX_DAYS : TRIAL_DAYS;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

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

  const tier = growthTier(user.growthScore);
  const nextTier = GROWTH_TIERS.find((candidate) => candidate.min > tier.min);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-ink-muted">
          What actually moved, over whichever window tells you something.
        </p>
      </header>

      <Card variant="gradient-border" className="flex flex-col items-center gap-6 p-7 sm:flex-row">
        <GrowthScore score={user.growthScore} size={112} showTier={false} />

        <div className="flex-1 text-center sm:text-left">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white"
            style={{ backgroundImage: tier.gradient }}
          >
            {tier.label}
          </span>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {user.growthScore}
            <span className="text-base font-medium text-ink-muted"> / 100</span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Profile quality, task completion and streak, weighted together.
          </p>
        </div>

        {nextTier && (
          <div className="w-full shrink-0 border-t border-hairline pt-4 text-center sm:w-auto sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 sm:text-left">
            <p className="text-xs font-medium text-ink-muted">Next tier</p>
            <p className="mt-1 text-sm font-semibold text-ink">{nextTier.label}</p>
            <p className="text-xs text-ink-muted">{nextTier.min - user.growthScore} points away</p>
          </div>
        )}
      </Card>

      <AnalyticsView points={points} postDates={postDates} unlocked={unlocked} />
    </div>
  );
}
