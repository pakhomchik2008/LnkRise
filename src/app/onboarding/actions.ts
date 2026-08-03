"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { analyzeProfile, generateDailyBrief, generateStrategy } from "@/lib/ai";
import { requireUserId } from "@/lib/auth";
import { attachRealPeople, tasksFromBrief } from "@/lib/briefs";
import { PLAN_ACCESS } from "@/lib/constants";
import { labelInspirations } from "@/lib/linkedin/inspirations";
import { prisma, toJson } from "@/lib/prisma";
import { toUtcDay } from "@/lib/utils";
import type { OnboardingAnswers } from "@/types";

const answersSchema = z.object({
  workStatus: z.enum(["working", "studying", "both", "transitioning"]),
  goal: z.enum(["get_hired", "personal_brand", "generate_leads", "network", "thought_leadership"]),
  industry: z.string().trim().min(2).max(120),
  linkedinUrl: z.string().trim().max(300),
  inspirations: z.array(z.string().url()).max(3),
  challenge: z.string().trim().min(2).max(1000),
  timeBudget: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  followUps: z.record(z.string(), z.string().max(1000)).optional(),
});

export type CompleteOnboardingResult =
  | { ok: true; source: "ai" | "mock" }
  | { ok: false; error: string };

export async function completeOnboarding(input: unknown): Promise<CompleteOnboardingResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "Your session expired. Sign in again and your answers will still be here." };
  }

  const parsed = answersSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Some answers did not come through. Go back and check them." };
  }

  const answers = parsed.data as OnboardingAnswers;

  try {
    const analysis = await analyzeProfile(userId, answers, null);
    const strategy = await generateStrategy(userId, answers, analysis.value);
    let brief = (await generateDailyBrief(userId, answers, strategy.value, 1, [])).value;

    // Named people (the inspirations named during onboarding) are a
    // commentCoaching-gated feature — trial does not get them. Every
    // signup lands on "trial" below, so this branch is currently
    // unreachable from this call site: there is no upgrade-to-paid flow
    // yet (Stripe/billing is Phase 6). The gate is correct now so nothing
    // has to change here once billing exists — it will just start firing.
    const newSubscriptionPlan = "trial" as const;
    if (PLAN_ACCESS[newSubscriptionPlan].commentCoaching) {
      const inspirations = labelInspirations(answers.inspirations);
      brief = attachRealPeople(brief, inspirations);
    }

    const today = toUtcDay();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          onboardingData: toJson(answers),
          strategy: toJson(strategy.value),
          linkedinData: toJson(analysis.value),
          linkedinUrl: answers.linkedinUrl || null,
          inspirations: answers.inspirations,
          dailyTimeBudget: answers.timeBudget,
          growthScore: Math.round(analysis.value.overallScore * 0.35),
          onboardedAt: new Date(),
          lastActiveAt: new Date(),
        },
      });

      await tx.subscription.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          plan: "trial",
          status: "trialing",
          trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      });

      const created = await tx.dailyBrief.upsert({
        where: { userId_date: { userId, date: today } },
        update: { content: toJson(brief) },
        create: { userId, date: today, content: toJson(brief) },
      });

      // Replace any tasks already attached to today's brief so a re-run is idempotent.
      await tx.coachingTask.deleteMany({ where: { briefId: created.id } });
      await tx.coachingTask.createMany({
        data: tasksFromBrief(brief).map((task) => ({
          type: task.type,
          title: task.title,
          description: task.description,
          priority: task.priority,
          aiData: task.aiData ? toJson(task.aiData) : undefined,
          userId,
          briefId: created.id,
        })),
      });
    });

    revalidatePath("/dashboard");
    return { ok: true, source: analysis.source };
  } catch (error) {
    console.error("[onboarding] failed to build the plan", error);
    return {
      ok: false,
      error: "Something failed while building your plan. Your answers are saved — try again.",
    };
  }
}
