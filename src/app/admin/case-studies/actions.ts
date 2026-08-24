"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminId } from "@/lib/auth";
import { prisma, toJson } from "@/lib/prisma";

const statsSchema = z.object({
  profileViews: z.coerce.number().int().min(0),
  followers: z.coerce.number().int().min(0),
  postImpressions: z.coerce.number().int().min(0),
});

const caseStudySchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, "Slug is lowercase letters, digits and dashes."),
  title: z.string().trim().min(1).max(180),
  userName: z.string().trim().min(1).max(120),
  userImage: z.union([z.string().trim().url(), z.literal("")]).optional(),
  userRole: z.string().trim().max(120).optional(),
  story: z.string().trim().min(1),
  testimonial: z.string().trim().max(2000).optional(),
  published: z.boolean().default(false),
  beforeStats: statsSchema,
  afterStats: statsSchema,
});

function parseForm(formData: FormData) {
  return caseStudySchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    userName: formData.get("userName"),
    userImage: formData.get("userImage") ?? undefined,
    userRole: formData.get("userRole") ?? undefined,
    story: formData.get("story"),
    testimonial: formData.get("testimonial") ?? undefined,
    published: formData.get("published") === "on",
    beforeStats: {
      profileViews: formData.get("beforeProfileViews"),
      followers: formData.get("beforeFollowers"),
      postImpressions: formData.get("beforePostImpressions"),
    },
    afterStats: {
      profileViews: formData.get("afterProfileViews"),
      followers: formData.get("afterFollowers"),
      postImpressions: formData.get("afterPostImpressions"),
    },
  });
}

export async function createCaseStudy(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  await requireAdminId();

  const parsed = parseForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const created = await prisma.caseStudy.create({
    data: {
      slug: parsed.data.slug,
      title: parsed.data.title,
      userName: parsed.data.userName,
      userImage: parsed.data.userImage || null,
      userRole: parsed.data.userRole || null,
      story: parsed.data.story,
      testimonial: parsed.data.testimonial || null,
      published: parsed.data.published,
      beforeStats: toJson(parsed.data.beforeStats),
      afterStats: toJson(parsed.data.afterStats),
    },
  });

  revalidatePath("/admin/case-studies");
  revalidatePath("/case-studies");
  return { ok: true, id: created.id };
}

export async function updateCaseStudy(
  id: string,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminId();

  const parsed = parseForm(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await prisma.caseStudy.findUnique({ where: { id }, select: { slug: true } });

  await prisma.caseStudy.update({
    where: { id },
    data: {
      slug: parsed.data.slug,
      title: parsed.data.title,
      userName: parsed.data.userName,
      userImage: parsed.data.userImage || null,
      userRole: parsed.data.userRole || null,
      story: parsed.data.story,
      testimonial: parsed.data.testimonial || null,
      published: parsed.data.published,
      beforeStats: toJson(parsed.data.beforeStats),
      afterStats: toJson(parsed.data.afterStats),
    },
  });

  revalidatePath("/admin/case-studies");
  revalidatePath(`/admin/case-studies/${id}`);
  revalidatePath("/case-studies");
  if (existing?.slug) revalidatePath(`/case-studies/${existing.slug}`);
  if (existing?.slug !== parsed.data.slug) revalidatePath(`/case-studies/${parsed.data.slug}`);
  return { ok: true };
}

export async function deleteCaseStudy(id: string): Promise<{ ok: boolean }> {
  await requireAdminId();
  await prisma.caseStudy.delete({ where: { id } });
  revalidatePath("/admin/case-studies");
  revalidatePath("/case-studies");
  return { ok: true };
}
