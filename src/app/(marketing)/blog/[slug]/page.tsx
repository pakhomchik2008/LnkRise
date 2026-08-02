import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  return prisma.blogPost.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt ?? undefined,
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

function readingTime(content: string): number {
  return Math.max(1, Math.round(content.split(/\s+/).length / 220));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const paragraphs = post.content.split("\n\n").filter(Boolean);

  return (
    <article className="px-5 py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" />
          All posts
        </Link>

        <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
          {post.title}
        </h1>

        <p className="mt-4 font-mono text-xs text-ink-muted">
          {post.author}
          {post.publishedAt ? ` · ${post.publishedAt.toLocaleDateString("en-GB")}` : ""} ·{" "}
          {readingTime(post.content)} min read
        </p>

        <div className="mt-10 space-y-5">
          {paragraphs.map((paragraph, index) =>
            paragraph.startsWith("## ") ? (
              <h2 key={index} className="pt-4 text-xl font-semibold text-ink">
                {paragraph.replace("## ", "")}
              </h2>
            ) : (
              <p key={index} className="text-base leading-relaxed text-ink">
                {paragraph}
              </p>
            ),
          )}
        </div>
      </div>
    </article>
  );
}
