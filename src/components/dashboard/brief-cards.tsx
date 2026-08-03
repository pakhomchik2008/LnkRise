"use client";

import { motion } from "framer-motion";
import { Check, Copy, MessageSquare, PenLine, Search, Send, UserPlus, Wrench } from "lucide-react";
import * as React from "react";
import { toggleTask } from "@/app/(app)/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import type { TaskRef } from "@/lib/briefs";
import { cn } from "@/lib/utils";
import type { DailyBriefContent } from "@/types";
import { PublishDialog, type PublishConfig } from "./publish-dialog";

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({
        tone: "error",
        title: "Could not copy",
        description: "Your browser blocked clipboard access — select the text instead.",
      });
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={copy}
      icon={copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

/**
 * Per-item "done" toggle. Every checkable thing in these cards (the post, one
 * person to reach out to, one conversation to join, the profile tip) is its
 * own CoachingTask row, so each gets its own independent toggle rather than
 * a shared list somewhere else on the page.
 */
function DoneToggle({ taskId, done, label = "Mark as done" }: { taskId?: string; done: boolean; label?: string }) {
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [optimisticDone, setOptimisticDone] = React.useOptimistic(done, (_current, next: boolean) => next);

  if (!taskId) return null;

  function onClick() {
    startTransition(async () => {
      setOptimisticDone(!optimisticDone);
      const result = await toggleTask(taskId as string);
      if (!result.ok) toast({ tone: "error", title: result.error });
    });
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={optimisticDone}
      onClick={onClick}
      disabled={pending}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150",
        optimisticDone
          ? "border-transparent bg-accent-green/15 text-emerald-700"
          : "border-hairline text-ink-muted hover:border-brand-300 hover:text-ink",
        pending && "opacity-60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-3.5 place-items-center rounded-full border transition-colors duration-150",
          optimisticDone ? "border-transparent bg-accent-green" : "border-current",
        )}
      >
        {optimisticDone && <Check className="size-2.5 text-white" strokeWidth={3} />}
      </span>
      {optimisticDone ? "Done" : label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Post
// ---------------------------------------------------------------------------

export function PostDraftCard({
  post,
  task,
  publish,
}: {
  post: DailyBriefContent["postIdea"];
  task?: TaskRef;
  publish?: PublishConfig;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <PenLine aria-hidden className="size-4 text-brand-500" />
            Today&rsquo;s post
          </CardTitle>
          <CardDescription>The exact text below is ready to publish — copy it or post it directly.</CardDescription>
        </div>
        <Badge tone="info">Ready</Badge>
      </CardHeader>

      <p className="rounded-[var(--radius-sm)] bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
        <span className="font-semibold text-ink">Why this topic: </span>
        {post.why}
      </p>

      <p className="mt-4 text-xs font-semibold text-ink">
        Post this on LinkedIn
      </p>
      <div className="mt-1.5 rounded-[var(--radius-sm)] border border-hairline bg-surface p-3.5">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
          {post.draft}
        </pre>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {publish && <PublishDialog text={post.draft} config={publish} />}
          <CopyButton text={post.draft} label="Copy this post" />
        </div>
        <DoneToggle taskId={task?.id} done={task?.done ?? false} label="Mark as posted" />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Connect
// ---------------------------------------------------------------------------

export function ConnectCard({
  items,
  tasks,
}: {
  items: DailyBriefContent["connectWith"];
  tasks: TaskRef[];
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserPlus aria-hidden className="size-4 text-brand-500" />
            People to connect with today
          </CardTitle>
          <CardDescription>
            For each one: search LinkedIn with the query shown, open a profile that matches, then
            send the message as your connection note.
          </CardDescription>
        </div>
      </CardHeader>

      <ul className="space-y-5">
        {items.map((item, index) => (
          <motion.li
            key={item.audience}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            className="border-b border-hairline pb-5 last:border-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">{item.audience}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{item.why}</p>
              </div>
              <DoneToggle taskId={tasks[index]?.id} done={tasks[index]?.done ?? false} label="Mark as reached out" />
            </div>

            {item.searchQuery && (
              <div className="mt-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted">
                  <Search aria-hidden className="size-3" />
                  Step 1 — search LinkedIn for
                </p>
                <div className="mt-1 flex items-start gap-2">
                  <p className="min-w-0 flex-1 truncate rounded-[var(--radius-sm)] bg-surface-muted px-2.5 py-2 font-mono text-[11px] text-ink">
                    {item.searchQuery}
                  </p>
                  <CopyButton text={item.searchQuery} label="Copy" />
                </div>
              </div>
            )}

            <div className="mt-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted">
                <Send aria-hidden className="size-3" />
                {item.searchQuery ? "Step 2 — send this as your note" : "Send this as your connection note"}
              </p>
              <div className="mt-1 rounded-[var(--radius-sm)] bg-surface-muted px-2.5 py-2 text-xs leading-relaxed text-ink">
                {item.message}
              </div>
              <div className="mt-1.5">
                <CopyButton text={item.message} label="Copy message" />
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Comment
// ---------------------------------------------------------------------------

export function CommentCard({
  items,
  tasks,
}: {
  items: DailyBriefContent["commentOn"];
  tasks: TaskRef[];
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare aria-hidden className="size-4 text-brand-500" />
            Comments to leave today
          </CardTitle>
          <CardDescription>
            For each topic: find a recent LinkedIn post that matches, then post one of the comments
            below on it, as-is or lightly adjusted.
          </CardDescription>
        </div>
      </CardHeader>

      <ul className="space-y-5">
        {items.map((item, index) => (
          <motion.li
            key={item.topic}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            className="border-b border-hairline pb-5 last:border-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                {item.person ? (
                  <p className="text-sm font-semibold text-ink">
                    Check{" "}
                    <a
                      href={item.person.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 underline-offset-2 hover:underline"
                    >
                      {item.person.name}&rsquo;s profile
                    </a>{" "}
                    for a new post
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-ink">Find a post about: {item.topic}</p>
                )}
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{item.why}</p>
                {item.person && (
                  <Badge tone="premium" className="mt-1.5">
                    From people you follow
                  </Badge>
                )}
              </div>
              <DoneToggle taskId={tasks[index]?.id} done={tasks[index]?.done ?? false} />
            </div>

            <p className="mt-3 text-[11px] font-semibold text-ink-muted">
              Pick one comment to post ({item.timeEstimate})
            </p>
            <ul className="mt-1.5 space-y-2">
              {item.starters.map((starter) => (
                <li
                  key={starter}
                  className="rounded-[var(--radius-sm)] border border-hairline bg-surface-muted px-3 py-2.5"
                >
                  <p className="text-xs leading-relaxed text-ink">{starter}</p>
                  <div className="mt-1.5">
                    <CopyButton text={starter} label="Copy comment" />
                  </div>
                </li>
              ))}
            </ul>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Profile tip
// ---------------------------------------------------------------------------

export function OptimizeCard({
  tip,
  task,
}: {
  tip: DailyBriefContent["optimizationTip"];
  task?: TaskRef;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wrench aria-hidden className="size-4 text-brand-500" />
            One profile fix for today
          </CardTitle>
          <CardDescription>{tip.title}</CardDescription>
        </div>
        <DoneToggle taskId={task?.id} done={task?.done ?? false} />
      </CardHeader>

      <p className="text-sm leading-relaxed text-ink">{tip.detail}</p>
    </Card>
  );
}
