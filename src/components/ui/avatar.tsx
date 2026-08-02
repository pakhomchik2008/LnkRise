"use client";

import Image from "next/image";
import * as React from "react";
import { cn, initials } from "@/lib/utils";

export type AvatarStatus = "online" | "away" | "offline";
export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}

const SIZES: Record<AvatarSize, { box: string; text: string; px: number }> = {
  sm: { box: "size-7", text: "text-[10px]", px: 28 },
  md: { box: "size-9", text: "text-xs", px: 36 },
  lg: { box: "size-12", text: "text-sm", px: 48 },
  xl: { box: "size-20", text: "text-xl", px: 80 },
};

const STATUS_COLORS: Record<AvatarStatus, string> = {
  online: "bg-accent-green",
  away: "bg-accent-orange",
  offline: "bg-ink-muted",
};

export function Avatar({ name, email, src, size = "md", status, className }: AvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const dims = SIZES[size];
  const showImage = Boolean(src) && !failed;

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center overflow-hidden rounded-full",
          "font-semibold text-white [background:var(--gradient-primary)]",
          dims.box,
          dims.text,
        )}
      >
        {showImage ? (
          <Image
            src={src as string}
            alt={name ?? "Profile picture"}
            width={dims.px}
            height={dims.px}
            className="size-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          initials(name, email)
        )}
      </span>

      {status && (
        <span
          aria-label={`Status: ${status}`}
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-surface",
            STATUS_COLORS[status],
          )}
        />
      )}
    </span>
  );
}
