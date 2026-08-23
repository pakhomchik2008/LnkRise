import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminContentPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, slug: true, title: true, published: true, updatedAt: true, tags: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Blog posts</h1>
          <p className="mt-1 text-sm text-white/60">
            {posts.length} post{posts.length === 1 ? "" : "s"}. Draft posts are not visible on the public blog.
          </p>
        </div>
        <Link
          href="/admin/content/new"
          className="rounded-[var(--radius-sm)] bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white/90"
        >
          New post
        </Link>
      </header>

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {posts.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link href={`/admin/content/${p.id}`} className="font-medium text-white hover:underline">
                    {p.title}
                  </Link>
                  <p className="truncate text-xs text-white/50">/{p.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      p.published ? "bg-accent-green/20 text-emerald-300" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {p.published ? "published" : "draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-white/60">{p.tags.join(", ") || "—"}</td>
                <td className="px-4 py-3 text-xs text-white/60">{p.updatedAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
