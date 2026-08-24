"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createApiKey, revokeApiKey } from "@/lib/api-keys";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Result = { ok: true } | { ok: false; error: string };

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(80),
  linkedinUrl: z.string().trim().max(300),
});

export async function updateProfile(formData: FormData): Promise<Result> {
  const userId = await requireUserId();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    linkedinUrl: formData.get("linkedinUrl") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check those fields" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      linkedinUrl: parsed.data.linkedinUrl || null,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}

const preferencesSchema = z.object({
  emailBriefEnabled: z.coerce.boolean(),
  emailBriefHour: z.coerce.number().int().min(0).max(23),
  timezone: z.string().trim().min(1).max(64),
  language: z.string().trim().min(2).max(8),
  postingFrequency: z.enum(["daily", "3_per_week", "weekly"]),
  contentTone: z.enum(["professional", "conversational", "bold", "storyteller"]),
  dailyTimeBudget: z.coerce.number().int().refine((value) => [15, 30, 60].includes(value), {
    message: "Pick 15, 30 or 60 minutes",
  }),
});

export async function updatePreferences(formData: FormData): Promise<Result> {
  const userId = await requireUserId();

  const parsed = preferencesSchema.safeParse({
    emailBriefEnabled: formData.get("emailBriefEnabled") === "on",
    emailBriefHour: formData.get("emailBriefHour"),
    timezone: formData.get("timezone"),
    language: formData.get("language"),
    postingFrequency: formData.get("postingFrequency"),
    contentTone: formData.get("contentTone"),
    dailyTimeBudget: formData.get("dailyTimeBudget"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check those settings" };
  }

  await prisma.user.update({ where: { id: userId }, data: parsed.data });

  revalidatePath("/settings");
  return { ok: true };
}

const inspirationsSchema = z.array(z.string().trim().url()).max(3);

/** The people-you-admire URLs, collected at onboarding but editable after. */
export async function updateInspirations(urls: string[]): Promise<Result> {
  const userId = await requireUserId();

  const parsed = inspirationsSchema.safeParse(urls.filter(Boolean));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check those URLs" };
  }

  await prisma.user.update({ where: { id: userId }, data: { inspirations: parsed.data } });

  revalidatePath("/settings");
  return { ok: true };
}

/**
 * Hard delete. Every related row cascades from the User row, so this removes
 * briefs, tasks, posts, analytics, sessions and OAuth links along with it.
 * The UI requires the user to type their email before this is callable.
 */
export async function deleteAccount(formData: FormData): Promise<Result> {
  const userId = await requireUserId();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });

  const confirmation = String(formData.get("confirmEmail") ?? "").trim().toLowerCase();

  if (confirmation !== user.email.toLowerCase()) {
    return { ok: false, error: "That does not match the email on this account." };
  }

  await prisma.user.delete({ where: { id: userId } });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Ingest keys for the browser extension
// ---------------------------------------------------------------------------

export async function issueApiKey(): Promise<
  { ok: true; raw: string } | { ok: false; error: string }
> {
  const userId = await requireUserId();

  const active = await prisma.apiKey.count({ where: { userId, revokedAt: null } });
  if (active >= 5) {
    return { ok: false, error: "You already have five active keys. Revoke one first." };
  }

  const created = await createApiKey(userId);
  revalidatePath("/settings");

  // The raw key is returned here and nowhere else — it is not recoverable.
  return { ok: true, raw: created.raw };
}

export async function revokeKey(keyId: string): Promise<Result> {
  const userId = await requireUserId();
  const revoked = await revokeApiKey(userId, keyId);

  if (!revoked) return { ok: false, error: "That key is already revoked." };

  revalidatePath("/settings");
  return { ok: true };
}
