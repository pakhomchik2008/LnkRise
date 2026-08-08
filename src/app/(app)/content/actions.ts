"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  generateConcepts,
  generateDraft,
  generateOutline,
  rewritePassage,
} from "@/lib/ai/content";
import { requireUserId } from "@/lib/auth";
import type { BestTime } from "@/lib/best-time";
import { PLAN_ACCESS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { consumeGeneration, quotaFor, releaseGeneration, type QuotaState } from "@/lib/quota";
import type {
  OnboardingAnswers,
  PlanId,
  PostConcept,
  PostOutline,
  RewriteMode,
  Strategy,
} from "@/types";

/**
 * Every generating action reserves a quota slot first and hands it back if the
 * work fails, so a model error does not cost the user one of three daily runs.
 */

export type ContentResult<T> =
  | ({ ok: true; source: "ai" | "mock"; quota: QuotaState } & T)
  | { ok: false; error: string; quota?: QuotaState };

async function loadPlan(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingData: true, strategy: true },
  });

  if (!user?.onboardingData || !user.strategy) return null;

  return {
    answers: user.onboardingData as unknown as OnboardingAnswers,
    strategy: user.strategy as unknown as Strategy,
  };
}

const OUT_OF_QUOTA =
  "You have used today's AI generations. They reset at midnight UTC, or upgrade for more.";

export async function suggestConcepts(): Promise<ContentResult<{ concepts: PostConcept[] }>> {
  const userId = await requireUserId();

  const plan = await loadPlan(userId);
  if (!plan) return { ok: false, error: "Finish onboarding first — ideas come from your answers." };

  const reserved = await consumeGeneration(userId);
  if (!reserved.ok) return { ok: false, error: OUT_OF_QUOTA, quota: reserved.state };

  try {
    const recent = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { title: true },
    });

    const result = await generateConcepts(
      userId,
      plan.answers,
      plan.strategy,
      recent.map((post) => post.title).filter((title): title is string => Boolean(title)),
    );

    return { ok: true, concepts: result.value, source: result.source, quota: reserved.state };
  } catch (error) {
    await releaseGeneration(userId);
    console.error("[content] concepts failed", error);
    return { ok: false, error: "Could not come up with ideas just now. Try again." };
  }
}

const conceptSchema = z.object({
  topic: z.string().trim().min(1).max(300),
  angle: z.string().trim().min(1).max(500),
});

export async function outlineConcept(input: unknown): Promise<ContentResult<{ outline: PostOutline }>> {
  const userId = await requireUserId();

  const parsed = conceptSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That concept did not come through." };

  const plan = await loadPlan(userId);
  if (!plan) return { ok: false, error: "Finish onboarding first." };

  const reserved = await consumeGeneration(userId);
  if (!reserved.ok) return { ok: false, error: OUT_OF_QUOTA, quota: reserved.state };

  try {
    const result = await generateOutline(userId, plan.answers, parsed.data);
    return { ok: true, outline: result.value, source: result.source, quota: reserved.state };
  } catch (error) {
    await releaseGeneration(userId);
    console.error("[content] outline failed", error);
    return { ok: false, error: "Could not build the outline. Try again." };
  }
}

const outlineSchema = z.object({
  topic: z.string().trim().min(1).max(300),
  hook: z.string().trim().min(1).max(600),
  points: z.array(z.string().trim().min(1).max(600)).min(1).max(8),
  cta: z.string().trim().min(1).max(600),
});

export async function draftFromOutline(input: unknown): Promise<ContentResult<{ draft: string }>> {
  const userId = await requireUserId();

  const parsed = outlineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That outline did not come through." };

  const plan = await loadPlan(userId);
  if (!plan) return { ok: false, error: "Finish onboarding first." };

  const reserved = await consumeGeneration(userId);
  if (!reserved.ok) return { ok: false, error: OUT_OF_QUOTA, quota: reserved.state };

  try {
    const result = await generateDraft(plan.answers, parsed.data);
    return { ok: true, draft: result.value, source: result.source, quota: reserved.state };
  } catch (error) {
    await releaseGeneration(userId);
    console.error("[content] draft failed", error);
    return { ok: false, error: "Could not write the draft. Your outline is still here — try again." };
  }
}

const rewriteInputSchema = z.object({
  passage: z.string().trim().min(1).max(3000),
  mode: z.enum(["rewrite", "shorten", "expand", "bolder", "warmer", "paraphrase"]),
  fullDraft: z.string().max(3000),
});

export async function rewriteSelection(
  input: unknown,
): Promise<ContentResult<{ alternatives: string[] }>> {
  const userId = await requireUserId();

  const parsed = rewriteInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Select some text first." };

  const reserved = await consumeGeneration(userId);
  if (!reserved.ok) return { ok: false, error: OUT_OF_QUOTA, quota: reserved.state };

  try {
    const result = await rewritePassage(
      parsed.data.passage,
      parsed.data.mode as RewriteMode,
      parsed.data.fullDraft,
    );
    return {
      ok: true,
      alternatives: result.value,
      source: result.source,
      quota: reserved.state,
    };
  } catch (error) {
    await releaseGeneration(userId);
    console.error("[content] rewrite failed", error);
    return { ok: false, error: "Could not rewrite that passage. Try again." };
  }
}

// ---------------------------------------------------------------------------
// Saving — no quota, these do not call a model
// ---------------------------------------------------------------------------

const saveSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().trim().max(300).optional(),
  content: z.string().trim().min(1).max(3000),
  aiGenerated: z.boolean().optional(),
});

export async function saveDraft(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const userId = await requireUserId();

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "A draft needs some text, and must be under 3,000 characters." };
  }

  const { id, content, aiGenerated } = parsed.data;
  // Fall back to the first line as a title so the hub has something to show.
  const title = parsed.data.title || content.split("\n").find(Boolean)?.slice(0, 120) || "Untitled";

  try {
    if (id) {
      // updateMany, not update: it scopes by userId, so another user's id
      // matches zero rows instead of updating their post.
      const updated = await prisma.post.updateMany({
        where: { id, userId },
        data: { title, content },
      });
      if (updated.count === 0) return { ok: false, error: "That draft no longer exists." };

      revalidatePath("/content");
      return { ok: true, id };
    }

    const created = await prisma.post.create({
      data: { userId, title, content, status: "draft", aiGenerated: aiGenerated ?? false },
      select: { id: true },
    });

    revalidatePath("/content");
    return { ok: true, id: created.id };
  } catch (error) {
    console.error("[content] save failed", error);
    return { ok: false, error: "Could not save. Copy your text somewhere safe and try again." };
  }
}

const scheduleSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().trim().max(300).optional(),
  content: z.string().trim().min(1).max(3000),
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
});

export async function schedulePost(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const userId = await requireUserId();

  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "That did not come through — check the text and the time." };
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { ok: false, error: "That is not a valid date and time." };
  }
  if (scheduledAt.getTime() <= Date.now()) {
    return { ok: false, error: "Pick a time in the future." };
  }

  const { id, content } = parsed.data;
  const title = parsed.data.title || content.split("\n").find(Boolean)?.slice(0, 120) || "Untitled";

  try {
    if (id) {
      const updated = await prisma.post.updateMany({
        where: { id, userId },
        // Re-scheduling clears any earlier reminder, so a post pushed to a
        // new time gets a reminder for the new time, not silence.
        data: { title, content, status: "scheduled", scheduledAt, reminderSentAt: null },
      });
      if (updated.count === 0) return { ok: false, error: "That post no longer exists." };

      revalidatePath("/content");
      return { ok: true, id };
    }

    const created = await prisma.post.create({
      data: { userId, title, content, status: "scheduled", scheduledAt, aiGenerated: false },
      select: { id: true },
    });

    revalidatePath("/content");
    return { ok: true, id: created.id };
  } catch (error) {
    console.error("[content] schedule failed", error);
    return { ok: false, error: "Could not schedule. Try again." };
  }
}

export async function suggestedPostTime(): Promise<
  { ok: true; locked: false; time: BestTime } | { ok: true; locked: true } | { ok: false; error: string }
> {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscription: { select: { plan: true } } },
  });

  const plan = (user?.subscription?.plan ?? "trial") as PlanId;

  // Redacted on the server, same as the Connections lanes: a locked feature's
  // computed value must never reach the browser, or the gate is one network
  // tab inspection away from pointless.
  if (!PLAN_ACCESS[plan].analytics) return { ok: true, locked: true };

  const { bestTimeToPost } = await import("@/lib/best-time");
  const time = await bestTimeToPost(userId);
  return { ok: true, locked: false, time };
}

export async function deleteDraft(
  postId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();

  const deleted = await prisma.post.deleteMany({ where: { id: postId, userId, status: "draft" } });
  if (deleted.count === 0) return { ok: false, error: "Only drafts can be deleted." };

  revalidatePath("/content");
  return { ok: true };
}

export async function currentQuota(): Promise<QuotaState> {
  const userId = await requireUserId();
  return quotaFor(userId);
}
