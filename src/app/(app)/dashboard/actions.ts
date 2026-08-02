"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { computeGrowthScore } from "@/lib/briefs";
import { communityApiEnabled, LinkedInApiError, publishPost } from "@/lib/linkedin/client";
import { syncMemberAnalytics } from "@/lib/linkedin/sync";
import { getLinkedInConnection, hasScope } from "@/lib/linkedin/tokens";
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

// ---------------------------------------------------------------------------
// Publishing through the official API
// ---------------------------------------------------------------------------

const publishSchema = z.object({
  text: z.string().trim().min(1, "Nothing to publish").max(3000),
  taskId: z.string().optional(),
});

export type PublishOutcome =
  | { ok: true; urn: string }
  | { ok: false; error: string; reconnect?: boolean };

/**
 * Publishes a draft to the member's own feed.
 *
 * Only ever reached from a confirmation dialog in which the user has seen the
 * exact text. There is no scheduler and no background publish path — every
 * post that leaves this app was pressed by a human.
 */
export async function publishDraft(input: unknown): Promise<PublishOutcome> {
  const userId = await requireUserId();

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid draft" };
  }

  if (!communityApiEnabled()) {
    return { ok: false, error: "Publishing is not enabled on this deployment." };
  }

  const connection = await getLinkedInConnection(userId);

  if (connection.status === "disconnected") {
    return { ok: false, error: "Connect your account first.", reconnect: true };
  }
  if (connection.status === "expired" || !connection.accessToken || !connection.personUrn) {
    return { ok: false, error: "The connection expired. Reconnect to publish.", reconnect: true };
  }
  if (!hasScope(connection, "w_member_social")) {
    return { ok: false, error: "This account has not granted posting access. Reconnect to add it.", reconnect: true };
  }

  try {
    const { urn } = await publishPost(connection.accessToken, connection.personUrn, parsed.data.text);

    await prisma.post.create({
      data: {
        userId,
        content: parsed.data.text,
        status: "published",
        publishedAt: new Date(),
        aiGenerated: true,
        linkedinUrn: urn,
      },
    });

    if (parsed.data.taskId) {
      await prisma.coachingTask.updateMany({
        where: { id: parsed.data.taskId, userId },
        data: { status: "completed", completedAt: new Date() },
      });
      await recomputeScore(userId);
    }

    revalidatePath("/dashboard");
    return { ok: true, urn };
  } catch (error) {
    if (error instanceof LinkedInApiError && error.needsReauth) {
      return { ok: false, error: "The platform rejected the token. Reconnect.", reconnect: true };
    }
    console.error("[publish] failed", error);
    return { ok: false, error: "The platform refused the post. Nothing was published." };
  }
}

export async function syncAnalyticsNow(): Promise<{ ok: boolean; message: string }> {
  const userId = await requireUserId();
  const outcome = await syncMemberAnalytics(userId);

  if (!outcome.ok) return { ok: false, message: outcome.message };

  revalidatePath("/dashboard");
  return {
    ok: true,
    message:
      outcome.daysWritten === 0
        ? "Connected, but the platform returned no data for this period."
        : `Pulled ${outcome.daysWritten} ${outcome.daysWritten === 1 ? "day" : "days"} of impressions.`,
  };
}
