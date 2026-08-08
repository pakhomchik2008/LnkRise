"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const factSchema = z.object({
  id: z.string().cuid().optional(),
  question: z.string().trim().min(1).max(500),
  body: z.string().trim().min(1).max(4000),
  kind: z.string().trim().min(1).max(40),
});

export type FactResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveFact(input: unknown): Promise<FactResult> {
  const userId = await requireUserId();

  const parsed = factSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Write a few words at least — an empty answer is not a fact." };
  }

  const { id, question, body, kind } = parsed.data;

  try {
    if (id) {
      // updateMany scopes by userId, so another user's id matches zero rows
      // rather than editing their fact.
      const updated = await prisma.fact.updateMany({
        where: { id, userId },
        data: { question, body, kind },
      });
      if (updated.count === 0) return { ok: false, error: "That entry no longer exists." };

      revalidatePath("/facts");
      return { ok: true, id };
    }

    const created = await prisma.fact.create({
      data: { userId, question, body, kind },
      select: { id: true },
    });

    revalidatePath("/facts");
    return { ok: true, id: created.id };
  } catch (error) {
    console.error("[facts] save failed", error);
    return { ok: false, error: "Could not save that. Try again." };
  }
}

export async function deleteFact(factId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();

  const deleted = await prisma.fact.deleteMany({ where: { id: factId, userId } });
  if (deleted.count === 0) return { ok: false, error: "That entry no longer exists." };

  revalidatePath("/facts");
  return { ok: true };
}
