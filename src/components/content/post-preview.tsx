"use client";

import * as React from "react";
import { Monitor, Smartphone } from "lucide-react";
import { FOLD } from "@/lib/post-analysis";
import { cn } from "@/lib/utils";

/**
 * How the post will look in the feed.
 *
 * Deliberately not a pixel copy of LinkedIn's UI — the brand, the icons and
 * the chrome are theirs. What matters for writing is the part that is ours to
 * get right: the typography, the line wrapping and, above all, where the
 * "…see more" fold lands. The surrounding card is generic.
 */

export interface PostPreviewProps {
  text: string;
  authorName: string;
  authorHeadline: string;
}

type Device = "desktop" | "mobile";

export function PostPreview({ text, authorName, authorHeadline }: PostPreviewProps) {
  const [device, setDevice] = React.useState<Device>("desktop");
  const [expanded, setExpanded] = React.useState(false);

  const limit = FOLD[device];
  const folded = text.length > limit;
  const shown = folded && !expanded ? text.slice(0, limit) : text;

  const initials = authorName
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink-muted">PREVIEW</p>

        <div
          role="group"
          aria-label="Preview device"
          className="flex rounded-full border border-hairline p-0.5"
        >
          {(["desktop", "mobile"] as const).map((option) => {
            const Icon = option === "desktop" ? Monitor : Smartphone;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={device === option}
                onClick={() => setDevice(option)}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-150",
                  device === option ? "bg-ink/[0.07] text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon aria-hidden className="size-3.5" />
                {option === "desktop" ? "Desktop" : "Mobile"}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          "rounded-[var(--radius-md)] border border-hairline bg-surface p-4 transition-[max-width] duration-300",
          device === "mobile" ? "max-w-[380px]" : "max-w-full",
        )}
      >
        <div className="mb-3 flex items-center gap-2.5">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-600">
            {initials || "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{authorName}</p>
            <p className="truncate text-xs text-ink-muted">{authorHeadline}</p>
          </div>
        </div>

        {text.length === 0 ? (
          <p className="text-sm italic text-ink-muted">
            Your post appears here as you type.
          </p>
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
            {shown}
            {folded && !expanded && (
              <>
                <span aria-hidden>…</span>{" "}
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="font-medium text-ink-muted hover:underline"
                >
                  see more
                </button>
              </>
            )}
          </p>
        )}

        {folded && expanded && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-2 text-xs font-medium text-ink-muted hover:underline"
          >
            Collapse to the fold
          </button>
        )}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-ink-muted">
        {folded
          ? `Everything after ${limit} characters sits behind "see more" on ${device}. The lines above the cut are the whole pitch.`
          : `Short enough to show in full on ${device} — no "see more" cut.`}{" "}
        The exact cut-off is set by the platform and shifts; treat it as a guide.
      </p>
    </div>
  );
}
