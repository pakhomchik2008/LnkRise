import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContentEditor } from "@/components/content/content-editor";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quotaFor } from "@/lib/quota";
import type { OnboardingAnswers } from "@/types";

export const metadata: Metadata = {
  title: "Editor",
  robots: { index: false, follow: false },
};

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ post?: string; draft?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;

  const [user, quota] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, onboardedAt: true, onboardingData: true },
    }),
    quotaFor(userId),
  ]);

  if (!user?.onboardedAt) redirect("/onboarding");

  let initialContent = "";
  let postId: string | undefined;

  if (params.post) {
    // Scoped by userId, so another user's post id simply finds nothing.
    const post = await prisma.post.findFirst({
      where: { id: params.post, userId },
      select: { id: true, content: true },
    });
    if (post) {
      postId = post.id;
      initialContent = post.content;
    }
  } else if (params.draft) {
    // Handed over from the daily brief's "open in editor".
    initialContent = params.draft.slice(0, 3000);
  }

  const answers = user.onboardingData as unknown as OnboardingAnswers | null;

  // The headline lives on the onboarding profile form, not on `linkedinData`
  // — that column holds the generated ProfileAnalysis, whose `headline` is a
  // scored section object, not a string.
  const headline = answers?.profile?.headline?.trim();

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/content"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          All content
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
          {postId ? "Edit draft" : "New post"}
        </h1>
      </div>

      <ContentEditor
        postId={postId}
        initialContent={initialContent}
        authorName={user.name ?? "You"}
        authorHeadline={headline || answers?.industry || "Your headline"}
        quotaRemaining={quota.remaining}
        quotaLimit={quota.limit}
      />
    </div>
  );
}
