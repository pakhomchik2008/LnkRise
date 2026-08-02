import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "warning" | "error" | "info" | "premium" | "neutral";

export interface BadgeProps extends React.ComponentPropsWithoutRef<"span"> {
  tone?: BadgeTone;
  dot?: boolean;
}

const TONES: Record<BadgeTone, string> = {
  success: "bg-accent-green/12 text-emerald-700 border-accent-green/25",
  warning: "bg-accent-orange/12 text-orange-700 border-accent-orange/25",
  error: "bg-red-500/12 text-red-700 border-red-500/25",
  info: "bg-brand-500/12 text-brand-700 border-brand-500/25",
  premium: "text-white border-transparent [background:var(--gradient-accent)]",
  neutral: "bg-ink/[0.06] text-ink-muted border-hairline",
};

const DOTS: Record<BadgeTone, string> = {
  success: "bg-accent-green",
  warning: "bg-accent-orange",
  error: "bg-red-500",
  info: "bg-brand-500",
  premium: "bg-white",
  neutral: "bg-ink-muted",
};

export function Badge({ className, tone = "neutral", dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "text-[11px] font-semibold tracking-wide whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden className={cn("size-1.5 rounded-full", DOTS[tone])} />}
      {children}
    </span>
  );
}
