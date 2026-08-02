import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export interface BlogPreviewItem {
  slug: string;
  title: string;
  excerpt: string | null;
  tags: string[];
  publishedAt: Date | null;
}

export function BlogPreview({ posts }: { posts: BlogPreviewItem[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="border-t border-hairline px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Recently written
          </h2>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            All posts
            <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 transition-shadow duration-300 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex flex-wrap gap-1.5">
                {post.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[11px] font-medium text-ink-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h3 className="mt-3 text-base font-semibold leading-snug text-ink">
                <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                  {post.title}
                </Link>
              </h3>

              {post.excerpt && (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                  {post.excerpt}
                </p>
              )}

              {post.publishedAt && (
                <p className="mt-4 font-mono text-[11px] text-ink-muted">
                  {formatDistanceToNow(post.publishedAt, { addSuffix: true })}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
