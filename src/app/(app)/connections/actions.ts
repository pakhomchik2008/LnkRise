"use server";

import { revalidatePath } from "next/cache";
import { generateConnectionPlan } from "@/lib/ai/connection-strategy";
import { requireUserId } from "@/lib/auth";
import { prisma, toJson } from "@/lib/prisma";
import type { ConnectionPlan, OnboardingAnswers, Strategy } from "@/types";

export type ConnectionPlanResult =
  | { ok: true; plan: ConnectionPlan }
  | { ok: false; error: string };

/**
 * Builds the four outreach lanes and stores them.
 *
 * Stored rather than generated per request because the AI path costs a call
 * and the page is read far more often than the plan changes — and because a
 * plan that quietly reworded itself on every visit would be useless to work
 * against over a week.
 */
export async function refreshConnectionPlan(): Promise<ConnectionPlanResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "Your session expired. Sign in again." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingData: true, strategy: true },
  });

  if (!user?.onboardingData || !user.strategy) {
    return { ok: false, error: "Finish onboarding first — the lanes are built from your answers." };
  }

  try {
    const generated = await generateConnectionPlan(
      user.onboardingData as unknown as OnboardingAnswers,
      user.strategy as unknown as Strategy,
    );

    await prisma.user.update({
      where: { id: userId },
      data: { connectionPlan: toJson(generated.value) },
    });

    revalidatePath("/connections");
    return { ok: true, plan: generated.value };
  } catch (error) {
    console.error("[connections] failed to build the plan", error);
    return { ok: false, error: "Could not rebuild the lanes. Try again in a moment." };
  }
}
