"use client";

import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, Lock, RefreshCw, Search } from "lucide-react";
import * as React from "react";
import { refreshConnectionPlan } from "@/app/(app)/connections/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { ConnectionCategory, ConnectionPlan } from "@/types";

const ENTRANCE = { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } as const;

/**
 * Search runs on the People tab, where the operators in the query string are
 * actually honoured — the global search box treats them as literal words.
 */
function peopleSearchUrl(query: string): string {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
}

function CopyButton({ text, label }: { text: string; label: string }) {
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
 * A lane the current plan does not include. The category and the reason stay
 * visible — those are the part that helps someone decide whether to upgrade —
 * while the search string and the message, which are the actual deliverable,
 * do not render at all. They are withheld on the server, not blurred here.
 */
function LockedLane({ category, index }: { category: ConnectionCategory; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...ENTRANCE, delay: index * 0.06 }}
    >
      <Card className="h-full border-dashed">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink-muted">{category.label}</h3>
          <Badge tone="premium">
            <Lock aria-hidden className="mr-1 inline size-3" />
            Pro
          </Badge>
        </div>

        <p className="text-sm leading-relaxed text-ink-muted">{category.lookFor}</p>

        <p className="mt-4 text-xs leading-relaxed text-ink-muted">
          The search string and the opening message for this lane are part of Pro.
        </p>

        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={() => window.location.assign("/billing")}>
            See what Pro includes
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function Lane({ category, index }: { category: ConnectionCategory; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...ENTRANCE, delay: index * 0.06 }}
    >
      <Card className="h-full">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink">{category.label}</h3>
          <Badge tone="info">Lane {index + 1}</Badge>
        </div>

        <p className="text-sm leading-relaxed text-ink">{category.lookFor}</p>

        <p className="mt-3 rounded-[var(--radius-sm)] bg-surface-muted/60 px-3 py-2 text-xs leading-relaxed text-ink-muted">
          <span className="font-semibold text-ink">Why this lane: </span>
          {category.why}
        </p>

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-ink-muted">STEP 1 — FIND THEM</p>
          <code className="block overflow-x-auto whitespace-pre rounded-[var(--radius-sm)] border border-hairline bg-surface-muted/50 px-3 py-2 font-mono text-xs text-ink">
            {category.searchQuery}
          </code>
          <div className="mt-2 flex flex-wrap gap-2">
            <CopyButton text={category.searchQuery} label="Copy search" />
            <Button
              variant="ghost"
              size="sm"
              icon={<ExternalLink className="size-3.5" />}
              onClick={() => window.open(peopleSearchUrl(category.searchQuery), "_blank", "noopener")}
            >
              Open search
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-ink-muted">STEP 2 — SEND THIS</p>
          <p className="rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink">
            {category.message}
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">
            Replace {"{name}"} with their first name. A request with a note is accepted far more often
            than one without.
          </p>
          <div className="mt-2">
            <CopyButton text={category.message} label="Copy message" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function ConnectionLanes({
  plan,
  unlocked,
}: {
  plan: ConnectionPlan | null;
  unlocked: boolean;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [current, setCurrent] = React.useState(plan);

  function rebuild() {
    startTransition(async () => {
      const result = await refreshConnectionPlan();
      if (result.ok) {
        setCurrent(result.plan);
        toast({ tone: "success", title: "Lanes rebuilt", description: "Fresh angles, same four lanes." });
      } else {
        toast({ tone: "error", title: result.error });
      }
    });
  }

  if (!current) {
    return (
      <Card>
        <div className="flex flex-col items-start gap-3">
          <div className="grid size-9 place-items-center rounded-full bg-brand-500/10">
            <Search aria-hidden className="size-4 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">No lanes built yet</p>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-ink-muted">
              Four groups worth reaching out to, each with a search you can paste straight into the
              platform and a first message that is not generic. Built from your onboarding answers.
            </p>
          </div>
          <Button size="sm" loading={pending} onClick={rebuild}>
            Build my lanes
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl text-xs leading-relaxed text-ink-muted">
          You do the searching and the sending — we never message anyone as you, and nothing here
          runs automatically.
        </p>
        <Button
          variant="secondary"
          size="sm"
          loading={pending}
          onClick={rebuild}
          icon={<RefreshCw className={cn("size-3.5", pending && "animate-spin")} />}
        >
          Rebuild
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {current.categories.map((category, index) =>
          unlocked || index === 0 ? (
            <Lane key={category.id} category={category} index={index} />
          ) : (
            <LockedLane key={category.id} category={category} index={index} />
          ),
        )}
      </div>
    </div>
  );
}
