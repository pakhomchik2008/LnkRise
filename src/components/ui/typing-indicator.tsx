"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function TypingIndicator({ className, label = "Coach is thinking" }: { className?: string; label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-lg)] rounded-bl-sm",
        "border border-hairline bg-surface-muted px-4 py-3",
        className,
      )}
    >
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          aria-hidden
          className="size-1.5 rounded-full bg-ink-muted"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{
            duration: 1.05,
            repeat: Infinity,
            delay: index * 0.16,
            ease: "easeInOut",
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
