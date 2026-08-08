import "server-only";
import { prisma } from "@/lib/prisma";
import type { UserFact } from "@/types";

/**
 * Reading the fact bank for a generation.
 *
 * Every generator gets facts through this, so there is one place that decides
 * how many to send and in what order — a prompt that always saw the same
 * first three would produce posts that circle the same story forever.
 */

/**
 * Facts for a prompt, least-recently-used first.
 *
 * Rotation is by `lastUsedAt` rather than random so the bank is worked
 * through evenly and a user who added ten facts sees all ten used, instead of
 * whichever three the shuffle happened to favour.
 *
 * The cap exists because facts are verbatim user text of unbounded length;
 * without it a large bank would crowd out the rest of the prompt.
 */
export async function factsForPrompt(userId: string, limit = 8): Promise<UserFact[]> {
  const rows = await prisma.fact.findMany({
    where: { userId },
    orderBy: [{ lastUsedAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
    take: limit,
    select: { id: true, question: true, body: true, kind: true },
  });

  return rows;
}

/**
 * Marks facts as used, so the next generation reaches for different material.
 *
 * Called after a successful generation rather than inside `factsForPrompt`:
 * a failed or discarded generation should not push a fact to the back of the
 * queue when the user never saw the output.
 */
export async function markFactsUsed(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await prisma.fact.updateMany({ where: { id: { in: ids } }, data: { lastUsedAt: new Date() } });
}

export async function factCount(userId: string): Promise<number> {
  return prisma.fact.count({ where: { userId } });
}
