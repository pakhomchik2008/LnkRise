"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const waitlistSchema = z.object({
  email: z.string().email("That does not look like an email address"),
});

export async function joinWaitlist(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = waitlistSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  try {
    await prisma.waitlistEntry.upsert({
      where: { email: parsed.data.email },
      update: {},
      create: { email: parsed.data.email, source: "footer" },
    });
    return { ok: true };
  } catch (error) {
    console.error("[waitlist] failed to save entry", error);
    return { ok: false, error: "Could not save that right now. Try again in a moment." };
  }
}
