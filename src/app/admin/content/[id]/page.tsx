import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogForm } from "@/components/admin/blog-form";
import { prisma } from "@/lib/prisma";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // The `new` segment shares this route via nested folder — Next dispatches
  // `/admin/content/new` to the sibling `new/page.tsx`, but a stray reload
  // hitting the id route with a non-cuid still returns notFound cleanly.
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/content" className="text-xs text-white/50 hover:text-white">← Blog posts</Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Edit post</h1>
        </div>
        {post.published && (
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="text-xs text-white/60 hover:text-white"
          >
            View live →
          </Link>
        )}
      </div>

      <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] p-5">
        <BlogForm
          initial={{
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt ?? "",
            content: post.content,
            tags: post.tags.join(", "),
            published: post.published,
          }}
        />
      </div>
    </div>
  );
}
