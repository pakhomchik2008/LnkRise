"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCoachId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const emailSchema = z.string().trim().toLowerCase().email();

/**
 * Adds a client by email. If no account exists yet, this creates a shell row
 * so the coach can onboard them ahead of time — when the client eventually
 * signs in with that same email, the auth upsert lands on this row rather
 * than creating a second one, so the coachId link survives.
 */
export async function addClient(formData: FormData) {
  const coachId = await requireCoachId();
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };

  const email = parsed.data;
  if (email === (await prisma.user.findUnique({ where: { id: coachId }, select: { email: true } }))?.email) {
    return { error: "You can't add yourself as a client." };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, coachId: true, role: true } });

  if (existing?.role === "coach") {
    return { error: "That account is itself a coach account." };
  }
  if (existing?.coachId && existing.coachId !== coachId) {
    return { error: "That person already has a coach." };
  }

  await prisma.user.upsert({
    where: { email },
    update: { coachId },
    create: { email, coachId },
  });

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
