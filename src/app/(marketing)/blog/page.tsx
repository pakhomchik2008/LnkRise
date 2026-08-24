import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on building a professional presence without burning your evenings.",
  alternates: { canonical: "/blog" },
};

// Not statically prerendered: env vars marked "Sensitive" on Vercel (which
// DATABASE_URL is on this project) are only injected at request time, not
// during the build step, so a build-time Prisma call here fails the whole
// deploy. force-dynamic also means new posts show up without a rebuild,
// which is the right behaviour for admin-authored content anyway.
export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, title: true, excerpt: true, tags: true, publishedAt: true, author: true },
  });

  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">Blog</h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          What actually moves the numbers, what does not, and why most advice in this space is
          written by people who do not have to follow it.
        </p>

        {posts.length === 0 ? (
          <EmptyState
            className="mt-12"
            title="Nothing published yet"
            description="Run the database seed to load the starter posts, or write your first one from the admin panel."
          />
        ) : (
          <div className="mt-12 space-y-4">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="relative rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 transition-shadow duration-300 hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[11px] font-medium text-ink-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h2 className="mt-3 text-xl font-semibold leading-snug text-ink">
                  <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                    {post.title}
                  </Link>
                </h2>

                {post.excerpt && (
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{post.excerpt}</p>
                )}

                <p className="mt-4 font-mono text-[11px] text-ink-muted">
                  {post.author}
                  {post.publishedAt
                    ? ` · ${formatDistanceToNow(post.publishedAt, { addSuffix: true })}`
                    : ""}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
