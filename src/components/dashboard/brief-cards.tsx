"use client";

import { motion } from "framer-motion";
import { Check, ChevronDown, Copy, MessageSquare, PenLine, UserPlus } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { PublishDialog, type PublishConfig } from "./publish-dialog";
import type { DailyBriefContent } from "@/types";
import { cn } from "@/lib/utils";

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

export function PostDraftCard({
  post,
  publish,
}: {
  post: DailyBriefContent["postIdea"];
  publish?: PublishConfig;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <PenLine aria-hidden className="size-4 text-brand-500" />
            Today&rsquo;s post
          </CardTitle>
          <p className="mt-1 text-sm text-ink-muted">{post.topic}</p>
        </div>
        <Badge tone="info">Draft ready</Badge>
      </CardHeader>

      <p className="rounded-[var(--radius-sm)] bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
        <span className="font-semibold text-ink">Why this: </span>
        {post.why}
      </p>

      <div className="mt-4">
        <p className="text-xs font-semibold text-ink">Hook</p>
        <p className="mt-1 text-sm italic leading-relaxed text-ink">{post.hook}</p>
      </div>

      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 132 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative mt-4 overflow-hidden"
      >
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
          {post.draft}
        </pre>
        {!expanded && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent"
          />
        )}
      </motion.div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="mt-2 inline-flex items-center gap-1 self-start text-xs font-medium text-brand-600 hover:text-brand-700"
      >
        {expanded ? "Show less" : "Show the full draft"}
        <ChevronDown
          aria-hidden
          className={cn("size-3.5 transition-transform duration-300", expanded && "rotate-180")}
        />
      </button>

      <div className="mt-5 flex flex-wrap gap-2">
        {publish && <PublishDialog text={post.draft} config={publish} />}
        <CopyButton text={post.draft} label="Copy draft" />
        <CopyButton text={post.hook} label="Copy hook" />
      </div>
    </Card>
  );
}

export function ConnectCard({ items }: { items: DailyBriefContent["connectWith"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus aria-hidden className="size-4 text-brand-500" />
          Who to reach out to
        </CardTitle>
      </CardHeader>

      <ul className="space-y-4">
        {items.map((item, index) => (
          <motion.li
            key={item.audience}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            className="border-b border-hairline pb-4 last:border-0 last:pb-0"
          >
            <p className="text-sm font-medium text-ink">{item.audience}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.why}</p>

            {item.searchQuery && (
              <p className="mt-2 truncate rounded-[var(--radius-sm)] bg-surface-muted px-2 py-1.5 font-mono text-[11px] text-ink-muted">
                {item.searchQuery}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              <CopyButton text={item.message} label="Copy opener" />
              {item.searchQuery && <CopyButton text={item.searchQuery} label="Copy search" />}
            </div>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}

export function CommentCard({ items }: { items: DailyBriefContent["commentOn"] }) {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare aria-hidden className="size-4 text-brand-500" />
          Conversations worth joining
        </CardTitle>
      </CardHeader>

      <ul className="space-y-2">
        {items.map((item, index) => {
          const isOpen = open === index;
          return (
            <li key={item.topic} className="rounded-[var(--radius-sm)] border border-hairline">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left"
              >
                <span>
                  <span className="block text-sm font-medium text-ink">{item.topic}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-ink-muted">
                    {item.timeEstimate}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "mt-1 size-4 shrink-0 text-ink-muted transition-transform duration-300",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3">
                  <p className="text-xs leading-relaxed text-ink-muted">{item.why}</p>
                  <ul className="mt-2 space-y-1.5">
                    {item.starters.map((starter) => (
                      <li
                        key={starter}
                        className="rounded-[var(--radius-sm)] bg-surface-muted px-2.5 py-2 text-xs leading-relaxed text-ink"
                      >
                        {starter}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
