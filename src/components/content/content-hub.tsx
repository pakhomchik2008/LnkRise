"use client";

import { motion } from "framer-motion";
import { FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { deleteDraft } from "@/app/(app)/content/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { PostStatus, PostSummary } from "@/types";

const ENTRANCE = { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } as const;

const FILTERS: { id: PostStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
];

type Sort = "newest" | "performance" | "scheduled";

const SORTS: { id: Sort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "performance", label: "Best performing" },
  { id: "scheduled", label: "Scheduled date" },
];

const STATUS_TONE: Record<PostStatus, "neutral" | "info" | "success"> = {
  draft: "neutral",
  scheduled: "info",
  published: "success",
};

function firstLines(content: string, count = 2): string {
  return content.split("\n").filter(Boolean).slice(0, count).join(" ");
}

function views(post: PostSummary): number {
  return post.metrics?.views ?? 0;
}

export function ContentHub({ posts }: { posts: PostSummary[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [filter, setFilter] = React.useState<PostStatus | "all">("all");
  const [sort, setSort] = React.useState<Sort>("newest");
  const [pending, startTransition] = React.useTransition();

  const visible = React.useMemo(() => {
    const filtered = filter === "all" ? posts : posts.filter((post) => post.status === filter);

    return [...filtered].sort((a, b) => {
      if (sort === "performance") return views(b) - views(a);
      if (sort === "scheduled") {
        // Unscheduled posts sort last rather than being treated as epoch-zero.
        if (!a.scheduledAt && !b.scheduledAt) return 0;
        if (!a.scheduledAt) return 1;
        if (!b.scheduledAt) return -1;
        return a.scheduledAt.localeCompare(b.scheduledAt);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [posts, filter, sort]);

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteDraft(id);
      if (!result.ok) {
        toast({ tone: "error", title: result.error });
        return;
      }
      toast({ tone: "success", title: "Draft deleted" });
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1">
          {FILTERS.map((entry) => {
            const count =
              entry.id === "all"
                ? posts.length
                : posts.filter((post) => post.status === entry.id).length;

            return (
              <button
                key={entry.id}
                role="tab"
                aria-selected={filter === entry.id}
                onClick={() => setFilter(entry.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                  filter === entry.id
                    ? "bg-ink/[0.07] text-ink"
                    : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink",
                )}
              >
                {entry.label}
                <span className="ml-1.5 text-ink-muted">{count}</span>
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-xs text-ink-muted">
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="rounded-[var(--radius-sm)] border border-hairline bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-brand-500"
          >
            {SORTS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <Card>
          <div className="flex flex-col items-start gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-brand-500/10">
              <FileText aria-hidden className="size-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                {filter === "all" ? "Nothing written yet" : `No ${filter} posts`}
              </p>
              <p className="mt-1 max-w-lg text-xs leading-relaxed text-ink-muted">
                {filter === "all"
                  ? "Start from a blank page, a template, or let the editor suggest a concept built from your onboarding answers."
                  : "Change the filter, or write something new."}
              </p>
            </div>
            <Button size="sm" onClick={() => router.push("/content/editor")}>
              Write a post
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...ENTRANCE, delay: Math.min(index, 8) * 0.04 }}
            >
              <Card className="flex h-full flex-col">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Link
                    href={`/content/editor?post=${post.id}`}
                    className="min-w-0 text-sm font-semibold text-ink hover:underline"
                  >
                    {post.title ?? "Untitled"}
                  </Link>
                  <Badge tone={STATUS_TONE[post.status]}>{post.status}</Badge>
                </div>

                <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-ink-muted">
                  {firstLines(post.content)}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3">
                  <p className="font-mono text-[11px] text-ink-muted">
                    {new Date(post.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                    {post.status === "published" && post.metrics?.views !== undefined && (
                      <> · {post.metrics.views.toLocaleString("en-US")} views</>
                    )}
                    {post.status === "scheduled" && post.scheduledAt && (
                      <>
                        {" "}
                        · for{" "}
                        {new Date(post.scheduledAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </>
                    )}
                  </p>

                  {post.status === "draft" && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => remove(post.id)}
                      aria-label={`Delete ${post.title ?? "draft"}`}
                      className="text-ink-muted transition-colors hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
