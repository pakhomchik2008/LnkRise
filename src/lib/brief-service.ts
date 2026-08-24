import "server-only";
import { generateDailyBrief } from "@/lib/ai";
import { attachRealPeople, tasksFromBrief } from "@/lib/briefs";
import { PLAN_ACCESS, effectivePlan } from "@/lib/constants";
import { factsForPrompt, markFactsUsed } from "@/lib/fact-store";
import { labelInspirations } from "@/lib/linkedin/inspirations";
import { prisma, toJson } from "@/lib/prisma";
import type { DailyBriefContent, OnboardingAnswers, Strategy } from "@/types";

/**
 * Creating a day of the plan, shared by onboarding (day 1) and the cron
 * (every day after). Before this existed only onboarding wrote briefs, so a
 * user's plan silently stopped after their first day.
 */

export type EnsureBriefResult =
  | { status: "created"; content: DailyBriefContent; source: "ai" | "mock" }
  | { status: "existed"; content: DailyBriefContent }
  | { status: "skipped"; reason: "not_onboarded" | "no_strategy" };

/** Day 1 is the day they onboarded, so the first cron run after that is day 2. */
export function dayNumberFor(onboardedAt: Date, today: Date): number {
  const days = Math.floor((today.getTime() - onboardedAt.getTime()) / 86_400_000);
  return Math.max(1, days + 1);
}

export async function ensureBriefForUser(userId: string, date: Date): Promise<EnsureBriefResult> {
  const existing = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date } },
    select: { content: true },
  });

  if (existing) {
    return { status: "existed", content: existing.content as unknown as DailyBriefContent };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      onboardedAt: true,
      onboardingData: true,
      strategy: true,
      inspirations: true,
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
    },
  });

  if (!user?.onboardedAt || !user.onboardingData) return { status: "skipped", reason: "not_onboarded" };
  if (!user.strategy) return { status: "skipped", reason: "no_strategy" };

  const answers = user.onboardingData as unknown as OnboardingAnswers;
  const strategy = user.strategy as unknown as Strategy;

  // Steer away from ground already covered this week.
  const recent = await prisma.dailyBrief.findMany({
    where: { userId, date: { lt: date } },
    orderBy: { date: "desc" },
    take: 7,
    select: { content: true },
  });

  const recentTopics = recent
    .map((row) => (row.content as unknown as DailyBriefContent)?.postIdea?.topic)
    .filter((topic): topic is string => Boolean(topic));

  const facts = await factsForPrompt(userId);

  const generated = await generateDailyBrief(
    userId,
    answers,
    strategy,
    dayNumberFor(user.onboardedAt, date),
    recentTopics,
    facts,
  );

  await markFactsUsed(facts.map((fact) => fact.id));

  let content = generated.value;

  const plan = effectivePlan(user.subscription);
  if (PLAN_ACCESS[plan].commentCoaching) {
    content = attachRealPeople(content, labelInspirations(user.inspirations));
  }

  await prisma.$transaction(async (tx) => {
    const brief = await tx.dailyBrief.upsert({
      where: { userId_date: { userId, date } },
      update: { content: toJson(content) },
      create: { userId, date, content: toJson(content) },
    });

    await tx.coachingTask.deleteMany({ where: { briefId: brief.id } });
    await tx.coachingTask.createMany({
      data: tasksFromBrief(content).map((task) => ({
        type: task.type,
        title: task.title,
        description: task.description,
        priority: task.priority,
        aiData: task.aiData ? toJson(task.aiData) : undefined,
        userId,
        briefId: brief.id,
      })),
    });
  });

  return { status: "created", content, source: generated.source };
}
