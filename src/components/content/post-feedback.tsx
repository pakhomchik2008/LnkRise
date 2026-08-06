"use client";

import { AlertTriangle, Check, Clock, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MAX_LENGTH } from "@/lib/post-analysis";
import { cn } from "@/lib/utils";
import type { PostAnalysis, PostVerdict } from "@/types";

const VERDICT_TONE: Record<PostVerdict, "success" | "warning" | "error" | "neutral"> = {
  empty: "neutral",
  short: "warning",
  good: "success",
  long: "warning",
  over_limit: "error",
};

const VERDICT_LABEL: Record<PostVerdict, string> = {
  empty: "Nothing yet",
  short: "Short",
  good: "Good length",
  long: "Long",
  over_limit: "Too long",
};

function Row({
  icon,
  label,
  value,
  note,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone?: "good" | "bad" | "neutral";
}) {
  return (
    <div className="border-t border-hairline py-3 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
          {icon}
          {label}
        </p>
        <p
          className={cn(
            "text-xs font-semibold",
            tone === "good" && "text-emerald-700",
            tone === "bad" && "text-orange-700",
            tone === "neutral" && "text-ink",
          )}
        >
          {value}
        </p>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{note}</p>
    </div>
  );
}

/**
 * Structural read on the draft.
 *
 * Everything here is computed from the text itself — no model call, no
 * engagement data. The closing line says so, because a panel of numbers
 * invites the reader to assume they were measured against something.
 */
export function PostFeedback({ analysis }: { analysis: PostAnalysis }) {
  if (analysis.characters === 0) {
    return (
      <p className="text-xs leading-relaxed text-ink-muted">
        Start writing and this fills in — length, where the fold lands, whether the opening and the
        ending do their job.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={VERDICT_TONE[analysis.verdict]}>{VERDICT_LABEL[analysis.verdict]}</Badge>
        <span className="text-xs text-ink-muted">
          {analysis.characters.toLocaleString("en-US")} / {MAX_LENGTH.toLocaleString("en-US")}{" "}
          characters
        </span>
      </div>

      <Row
        icon={<Type aria-hidden className="size-3.5" />}
        label="OPENING"
        value={`${analysis.hookScore}/10`}
        note={analysis.hookNote}
        tone={analysis.hookScore >= 7 ? "good" : analysis.hookScore <= 4 ? "bad" : "neutral"}
      />

      <Row
        icon={
          analysis.hasCta ? (
            <Check aria-hidden className="size-3.5" />
          ) : (
            <AlertTriangle aria-hidden className="size-3.5" />
          )
        }
        label="CLOSING ASK"
        value={analysis.hasCta ? "Present" : "Missing"}
        note={analysis.ctaNote}
        tone={analysis.hasCta ? "good" : "bad"}
      />

      <Row
        icon={<Clock aria-hidden className="size-3.5" />}
        label="READ TIME"
        value={`~${analysis.readSeconds}s`}
        note={`${analysis.words} words. ${analysis.lengthNote}`}
      />

      <p className="mt-3 border-t border-hairline pt-3 text-xs leading-relaxed text-ink-muted">
        These check the shape of the post, not how it will perform. Nobody can tell you that in
        advance, and we will not pretend to — the opening score reads structure, not whether the
        idea is interesting.
      </p>
    </div>
  );
}
