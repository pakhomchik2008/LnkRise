"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCoachId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const emailSchema = z.string().trim().toLowerCase().email();

/**
 * Adds a client by email. Only two paths are allowed:
 *   1. No user row exists — create a shell row with { email, coachId }. When
 *      the client eventually signs in under that email, the auth adapter
 *      upserts onto this row and the coach link survives.
 *   2. A row exists but is itself a shell (never signed in, never onboarded)
 *      and unattached — attach it.
 *
 * A real, signed-in account that the coach did not create cannot be silently
 * adopted. If the coach knows a real user and wants them on the platform, the
 * user has to grant that through an out-of-band invitation the coach sends
 * (email/DM) — not by the coach typing their address into this form.
 */
export async function addClient(formData: FormData) {
  const coachId = await requireCoachId();
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };

  const email = parsed.data;
  if (email === (await prisma.user.findUnique({ where: { id: coachId }, select: { email: true } }))?.email) {
    return { error: "You can't add yourself as a client." };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, coachId: true, role: true, onboardedAt: true, lastActiveAt: true, emailVerified: true },
  });

  if (existing) {
    if (existing.role === "coach" || existing.role === "admin") {
      return { error: "That account is a coach or admin account and can't be a client." };
    }
    if (existing.coachId === coachId) {
      return { error: "That client is already on your list." };
    }
    if (existing.coachId) {
      return { error: "That person already has a coach." };
    }
    // A real, signed-in account (has ever signed in or verified email) is
    // never silently adopted — the account owner has to say yes first.
    const hasBeenUsed = Boolean(existing.onboardedAt || existing.lastActiveAt || existing.emailVerified);
    if (hasBeenUsed) {
      return {
        error: "That account already exists and isn't linked to any coach. Ask them to invite you in from their own account, or use a different email.",
      };
    }
    // Shell row (created by another flow, never used). Attach it.
    await prisma.user.update({ where: { id: existing.id }, data: { coachId } });
  } else {
    await prisma.user.create({ data: { email, coachId } });
  }

  revalidatePath("/coach");
  return { error: null };
}

export async function removeClient(clientId: string) {
  const coachId = await requireCoachId();

  await prisma.user.updateMany({
    where: { id: clientId, coachId },
    data: { coachId: null },
  });

  revalidatePath("/coach");
}

const brandingSchema = z.object({
  brandName: z.string().trim().max(60).optional(),
  brandLogoUrl: z.union([z.string().trim().url(), z.literal("")]).optional(),
  brandColor: z
    .union([z.string().trim().regex(/^#[0-9a-fA-F]{6}$/), z.literal("")])
    .optional(),
});

export async function updateBranding(formData: FormData) {
  const coachId = await requireCoachId();
  const parsed = brandingSchema.safeParse({
    brandName: formData.get("brandName"),
    brandLogoUrl: formData.get("brandLogoUrl"),
    brandColor: formData.get("brandColor"),
  });
  if (!parsed.success) return { error: "Check the fields and try again." };

  await prisma.user.update({
    where: { id: coachId },
    data: {
      brandName: parsed.data.brandName || null,
      brandLogoUrl: parsed.data.brandLogoUrl || null,
      brandColor: parsed.data.brandColor || null,
    },
  });

  revalidatePath("/coach/settings");
  return { error: null };
}
