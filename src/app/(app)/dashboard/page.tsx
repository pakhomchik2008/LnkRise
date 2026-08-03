import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Target } from "lucide-react";
import { BriefCards, BriefProgress } from "@/components/dashboard/brief-section";
import { DayComplete } from "@/components/dashboard/day-complete";
import { GrowthChart } from "@/components/dashboard/growth-chart";
import { StatsRow } from "@/components/dashboard/stats-row";
import { Card } from "@/components/ui/card";
import { GrowthScore } from "@/components/ui/growth-score";
import { requireUserId } from "@/lib/auth";
import { groupTasksByType } from "@/lib/briefs";
import { communityApiEnabled } from "@/lib/linkedin/client";
import { getLinkedInConnection, hasScope } from "@/lib/linkedin/tokens";
import { prisma } from "@/lib/prisma";
import { toUtcDay } from "@/lib/utils";
import type { DailyBriefContent, StatPoint, Strategy, TaskStatus, TaskType } from "@/types";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const userId = await requireUserId();
  const today = toUtcDay();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      growthScore: true,
      streak: true,
      strategy: true,
      onboardedAt: true,
    },
  });

  if (!user) redirect("/login");
  if (!user.onboardedAt) redirect("/onboarding");

  const [brief, tasks, snapshots] = await Promise.all([
    prisma.dailyBrief.findUnique({
      where: { userId_date: { userId, date: today } },
      select: { content: true, completed: true },
    }),
    prisma.coachingTask.findMany({
      where: { userId, createdAt: { gte: today } },
      select: { id: true, type: true, status: true },
    }),
    prisma.analyticsSnapshot.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      take: 14,
    }),
  ]);

  const content = (brief?.content ?? undefined) as unknown as DailyBriefContent | undefined;
  const strategy = user.strategy as unknown as Strategy | null;
  const dayComplete = (brief?.completed as Record<string, unknown> | null)?.dayComplete === true;

  const taskGroups = groupTasksByType(
    tasks.map((task) => ({
      id: task.id,
      type: task.type as TaskType,
      status: task.status as TaskStatus,
    })),
  );

  const points: StatPoint[] = snapshots.map((snapshot) => ({
    date: snapshot.date.toISOString().slice(0, 10),
    profileViews: snapshot.profileViews,
    postImpressions: snapshot.postImpressions,
    followers: snapshot.followers,
    connections: snapshot.connections,
  }));

  // Publishing only appears when it can actually work: flag on, account
  // connected and unexpired, and posting scope actually granted.
  const connection = communityApiEnabled() ? await getLinkedInConnection(userId) : null;

  const canPublish = Boolean(
    connection &&
      connection.status !== "disconnected" &&
      connection.status !== "expired" &&
      hasScope(connection, "w_member_social"),
  );

  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Good morning, {firstName}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {content?.todayFocus ?? "Your brief for today is not ready yet."}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
        <Card className="flex flex-col items-center justify-center lg:w-64">
          <GrowthScore score={user.growthScore} size={168} />
          {strategy && (
            <p className="mt-4 text-center text-xs leading-relaxed text-ink-muted">
              {strategy.headline}
            </p>
          )}
        </Card>

        <Card variant="gradient-border" className="flex flex-col justify-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-600">
            <Target aria-hidden className="size-3.5" />
            THE ONE THING TODAY
          </p>
          <p className="mt-3 text-lg font-semibold leading-snug text-ink">
            {content?.postIdea.topic ?? "Finish onboarding to get your first plan"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {content?.postIdea.why ??
              "Once your answers are in, this card holds the single action with the highest return for the day."}
          </p>
        </Card>
      </div>

      <StatsRow points={points} />

      {content && (
        <>
          <BriefProgress tasks={taskGroups} />
          <BriefCards
            content={content}
            tasks={taskGroups}
            publish={{ enabled: canPublish, taskId: taskGroups.post?.id }}
          />
        </>
      )}

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <GrowthChart points={points} />
        <DayComplete
          streak={user.streak}
          alreadyComplete={dayComplete}
          hasBrief={Boolean(brief)}
        />
      </div>
    </div>
  );
}
