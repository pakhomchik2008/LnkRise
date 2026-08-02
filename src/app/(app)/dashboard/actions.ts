"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { computeGrowthScore } from "@/lib/briefs";
import { prisma } from "@/lib/prisma";
import { toUtcDay } from "@/lib/utils";
import type { ProfileAnalysis } from "@/types";

type ActionResult = { ok: true } | { ok: false; error: string };

async function recomputeScore(userId: string): Promise<void> {
  const [user, tasks] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { streak: true, linkedinData: true },
    }),
    prisma.coachingTask.findMany({ where: { userId }, select: { status: true } }),
  ]);

  const analysis = user.linkedinData as unknown as ProfileAnalysis | null;

  const growthScore = computeGrowthScore({
    profileScore: analysis?.overallScore ?? 40,
    tasksCompleted: tasks.filter((task) => task.status === "completed").length,
    tasksTotal: tasks.length,
    streak: user.streak,
  });

  await prisma.user.update({ where: { id: userId }, data: { growthScore } });
}

export async function toggleTask(taskId: string): Promise<ActionResult> {
  const userId = await requireUserId();

  // Scoped by userId so a guessed id cannot flip someone else's task.
  const task = await prisma.coachingTask.findFirst({
    where: { id: taskId, userId },
    select: { id: true, status: true },
  });

  if (!task) return { ok: false, error: "That task no longer exists." };

  const nextStatus = task.status === "completed" ? "pending" : "completed";

  await prisma.coachingTask.update({
    where: { id: task.id },
    data: {
      status: nextStatus,
      completedAt: nextStatus === "completed" ? new Date() : null,
    },
  });

  await recomputeScore(userId);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function markDayComplete(): Promise<ActionResult | { ok: true; streak: number }> {
  const userId = await requireUserId();
  const today = toUtcDay();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { streak: true, longestStreak: true, lastActiveAt: true },
  });

  const brief = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId, date: today } },
    select: { id: true, completed: true },
  });

  if (!brief) return { ok: false, error: "No brief for today yet." };

  const alreadyDone = (brief.completed as Record<string, unknown>)?.dayComplete === true;
  if (alreadyDone) return { ok: true, streak: user.streak };

  // Continue the streak only if yesterday was also marked; otherwise restart.
  const lastActiveDay = user.lastActiveAt ? toUtcDay(user.lastActiveAt) : null;
  const continues = lastActiveDay?.getTime() === yesterday.getTime();
  const streak = continues ? user.streak + 1 : 1;

  await prisma.$transaction([
    prisma.dailyBrief.update({
      where: { id: brief.id },
      data: { completed: { ...(brief.completed as object), dayComplete: true } },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        streak,
        longestStreak: Math.max(user.longestStreak, streak),
        lastActiveAt: new Date(),
      },
    }),
  ]);

  await recomputeScore(userId);
  revalidatePath("/dashboard");
  return { ok: true, streak };
}

const statsSchema = z.object({
  profileViews: z.coerce.number().int().min(0).max(10_000_000),
  postImpressions: z.coerce.number().int().min(0).max(100_000_000),
  followers: z.coerce.number().int().min(0).max(100_000_000),
  connections: z.coerce.number().int().min(0).max(100_000),
});

export async function logTodayStats(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = statsSchema.safeParse({
    profileViews: formData.get("profileViews"),
    postImpressions: formData.get("postImpressions"),
    followers: formData.get("followers"),
    connections: formData.get("connections"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Those need to be whole numbers." };
  }

  await prisma.analyticsSnapshot.upsert({
    where: { userId_date: { userId, date: toUtcDay() } },
    update: { ...parsed.data, source: "manual" },
    create: { userId, date: toUtcDay(), ...parsed.data, source: "manual" },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
