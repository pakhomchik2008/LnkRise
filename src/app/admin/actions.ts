"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roleSchema = z.enum(["user", "coach", "admin"]);

export async function setUserRole(userId: string, role: string): Promise<{ ok: boolean; error?: string }> {
  const adminId = await requireAdminId();

  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "Invalid role." };

  if (userId === adminId && parsed.data !== "admin") {
    // Prevents an admin locking themselves out of the panel. Another admin
    // can still demote them from their own admin account.
    return { ok: false, error: "You can't remove your own admin role." };
  }

  await prisma.user.update({ where: { id: userId }, data: { role: parsed.data } });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function deleteUser(userId: string): Promise<{ ok: boolean; error?: string }> {
  const adminId = await requireAdminId();
  if (userId === adminId) return { ok: false, error: "You can't delete your own account here." };

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  return { ok: true };
}

const blogSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, "Slug is lowercase letters, digits and dashes."),
  title: z.string().trim().min(1).max(180),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1),
  tags: z.string().trim().max(200).optional(),
  published: z.boolean().default(false),
});

export async function createBlogPost(formData: FormData): Promise<{ ok: boolean; error?: string; id?: string }> {
  await requireAdminId();

  const parsed = blogSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    excerpt: formData.get("excerpt") ?? undefined,
    content: formData.get("content"),
    tags: formData.get("tags") ?? undefined,
    published: formData.get("published") === "on",
  });

  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const tags = parsed.data.tags?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [];

  const post = await prisma.blogPost.create({
    data: {
      slug: parsed.data.slug,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt || null,
      content: parsed.data.content,
      tags,
      published: parsed.data.published,
      publishedAt: parsed.data.published ? new Date() : null,
    },
  });

  revalidatePath("/admin/content");
  return { ok: true, id: post.id };
}

export async function updateBlogPost(id: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminId();

  const parsed = blogSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    excerpt: formData.get("excerpt") ?? undefined,
    content: formData.get("content"),
    tags: formData.get("tags") ?? undefined,
    published: formData.get("published") === "on",
  });

  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await prisma.blogPost.findUnique({ where: { id }, select: { publishedAt: true } });

  const tags = parsed.data.tags?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [];

  await prisma.blogPost.update({
    where: { id },
    data: {
      slug: parsed.data.slug,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt || null,
      content: parsed.data.content,
      tags,
      published: parsed.data.published,
      // Stamp publishedAt the first time it's published; leave it alone on
      // subsequent edits so the public "published X days ago" doesn't jump.
      publishedAt: parsed.data.published ? existing?.publishedAt ?? new Date() : null,
    },
  });

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${id}`);
  revalidatePath(`/blog/${parsed.data.slug}`);
  return { ok: true };
}

export async function deleteBlogPost(id: string): Promise<{ ok: boolean }> {
  await requireAdminId();
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/admin/content");
  return { ok: true };
}
