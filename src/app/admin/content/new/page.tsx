import Link from "next/link";
import { BlogForm } from "@/components/admin/blog-form";

export default function NewBlogPostPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/content" className="text-xs text-white/50 hover:text-white">← Blog posts</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">New blog post</h1>
      </div>

      <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] p-5">
        <BlogForm />
      </div>
    </div>
  );
}
