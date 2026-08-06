import "server-only";
import { PLAN_ACCESS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { toUtcDay } from "@/lib/utils";
import type { PlanId } from "@/types";

/**
 * Daily AI generation limit.
 *
 * PLAN_ACCESS has carried `aiGenerationsPerDay` since Phase 1 but nothing ever
 * read it, so the limit did not exist. This is the enforcement.
 */

export interface QuotaState {
  used: number;
  limit: number;
  remaining: number;
  plan: PlanId;
}

export async function quotaFor(userId: string): Promise<QuotaState> {
  const [user, usage] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { subscription: { select: { plan: true } } },
    }),
    prisma.aiUsage.findUnique({
      where: { userId_date: { userId, date: toUtcDay() } },
      select: { generations: true },
    }),
  ]);

  const plan = (user?.subscription?.plan ?? "trial") as PlanId;
  const limit = PLAN_ACCESS[plan].aiGenerationsPerDay;
  const used = usage?.generations ?? 0;

  return { used, limit, remaining: Math.max(0, limit - used), plan };
}

/**
 * Reserves one generation, or refuses.
 *
 * The count goes up *before* the model is called, not after. Two requests
 * arriving together would both read `used` and both pass a check-then-write,
 * so the increment and the limit test have to be the same operation. The
 * upsert is atomic; the read that follows is of the value this call produced.
 *
 * The cost of that ordering is that a failed generation still consumes a slot.
 * `releaseGeneration` exists for the caller to hand it back.
 */
export async function consumeGeneration(
  userId: string,
): Promise<{ ok: true; state: QuotaState } | { ok: false; state: QuotaState }> {
  const before = await quotaFor(userId);
  if (before.remaining <= 0) return { ok: false, state: before };

  const row = await prisma.aiUsage.upsert({
    where: { userId_date: { userId, date: toUtcDay() } },
    update: { generations: { increment: 1 } },
    create: { userId, date: toUtcDay(), generations: 1 },
    select: { generations: true },
  });

  // Lost the race: another request took the last slot between the read above
  // and this increment. Give it straight back and refuse.
  if (row.generations > before.limit) {
    await releaseGeneration(userId);
    return { ok: false, state: { ...before, used: before.limit, remaining: 0 } };
  }

  return {
    ok: true,
    state: {
      ...before,
      used: row.generations,
      remaining: Math.max(0, before.limit - row.generations),
    },
  };
}

/** Hands a reserved slot back after a generation fails. Never goes below zero. */
export async function releaseGeneration(userId: string): Promise<void> {
  await prisma.aiUsage.updateMany({
    where: { userId, date: toUtcDay(), generations: { gt: 0 } },
    data: { generations: { decrement: 1 } },
  });
}
