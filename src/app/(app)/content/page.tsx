import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PenLine } from "lucide-react";
import { ContentHub } from "@/components/content/content-hub";
import { TemplateLibrary } from "@/components/content/template-library";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth";
import { PLAN_ACCESS, effectivePlan } from "@/lib/constants";
import { templatesFor } from "@/lib/content-templates";
import { prisma } from "@/lib/prisma";
import { quotaFor } from "@/lib/quota";
import type { PostStatus, PostSummary } from "@/types";

export const metadata: Metadata = {
  title: "Content",
  robots: { index: false, follow: false },
};

export default async function ContentPage() {
  const userId = await requireUserId();

  const [user, posts, quota] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { onboardedAt: true, subscription: { select: { plan: true, status: true, currentPeriodEnd: true } } },
    }),
    prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        scheduledAt: true,
        publishedAt: true,
        createdAt: true,
        aiGenerated: true,
        metrics: true,
      },
    }),
    quotaFor(userId),
  ]);

  if (!user?.onboardedAt) redirect("/onboarding");

  const plan = effectivePlan(user.subscription);
  const summaries: PostSummary[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    status: post.status as PostStatus,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    aiGenerated: post.aiGenerated,
    metrics: post.metrics as PostSummary["metrics"],
  }));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Content</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Drafts, scheduled posts and everything you have published. {quota.remaining} of{" "}
            {quota.limit} AI runs left today.
          </p>
        </div>

        <Link href="/content/editor">
          <Button icon={<PenLine className="size-4" />}>New post</Button>
        </Link>
      </header>

      <ContentHub posts={summaries} />

      <section>
        <h2 className="mb-1 text-sm font-semibold text-ink">Templates</h2>
        <p className="mb-4 max-w-2xl text-xs leading-relaxed text-ink-muted">
          Shapes that reliably hold attention. Start from one when the blank page is the problem —
          the structure is the useful part, not the words.
        </p>
        <TemplateLibrary templates={templatesFor(PLAN_ACCESS[plan].fullBrief)} />
      </section>
    </div>
  );
}
