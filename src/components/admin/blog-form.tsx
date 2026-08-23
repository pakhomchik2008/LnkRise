"use client";

import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import { createBlogPost, deleteBlogPost, updateBlogPost } from "@/app/admin/actions";

type Initial = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string;
  published: boolean;
};

const empty: Initial = { slug: "", title: "", excerpt: "", content: "", tags: "", published: false };

export function BlogForm({ initial }: { initial?: Initial }) {
  const data = initial ?? empty;
  const isEdit = Boolean(data.id);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [state, action, submitting] = useActionState(
    async (_: { error: string | null }, formData: FormData) => {
      const result = isEdit && data.id
        ? await updateBlogPost(data.id, formData)
        : await createBlogPost(formData);

      if (!result.ok) return { error: result.error ?? "Failed" };

      if (!isEdit && "id" in result && result.id) {
        router.push(`/admin/content/${result.id}`);
      } else {
        router.refresh();
      }
      return { error: null };
    },
    { error: null },
  );

  function onDelete() {
    if (!data.id) return;
    if (!confirm("Delete this post? Cannot be undone.")) return;
    startTransition(async () => {
      await deleteBlogPost(data.id!);
      router.push("/admin/content");
    });
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-white/50">Title</span>
          <input
            name="title"
            defaultValue={data.title}
            required
            maxLength={180}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-white/50">Slug</span>
          <input
            name="slug"
            defaultValue={data.slug}
            required
            pattern="[a-z0-9-]+"
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-wide text-white/50">Excerpt</span>
        <textarea
          name="excerpt"
          defaultValue={data.excerpt}
          maxLength={500}
          rows={2}
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-wide text-white/50">Content (markdown)</span>
        <textarea
          name="content"
          defaultValue={data.content}
          required
          rows={16}
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs leading-relaxed text-white focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-wide text-white/50">Tags (comma separated)</span>
        <input
          name="tags"
          defaultValue={data.tags}
          maxLength={200}
          className="mt-1 w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" name="published" defaultChecked={data.published} />
        <span className="text-sm text-white/80">Published</span>
      </label>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[var(--radius-sm)] bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white/90 disabled:opacity-50"
        >
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create post"}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="rounded-[var(--radius-sm)] border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-40"
          >
            Delete post
          </button>
        )}
      </div>
    </form>
  );
}
