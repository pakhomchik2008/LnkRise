"use client";

import { motion } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChatBubbleProps {
  role: "coach" | "user";
  children: React.ReactNode;
  meta?: string;
  className?: string;
}

export function ChatBubble({ role, children, meta, className }: ChatBubbleProps) {
  const isCoach = role === "coach";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn("flex w-full", isCoach ? "justify-start" : "justify-end", className)}
    >
      <div className={cn("max-w-[85%] sm:max-w-[70%]", isCoach ? "items-start" : "items-end")}>
        <div
          className={cn(
            "rounded-[var(--radius-lg)] px-4 py-3 text-sm leading-relaxed",
            isCoach
              ? "rounded-bl-sm border border-hairline bg-surface-muted text-ink"
              : "rounded-br-sm text-white [background:var(--gradient-primary)]",
          )}
        >
          {children}
        </div>

        {meta && (
          <p className={cn("mt-1 text-[11px] text-ink-muted", isCoach ? "text-left" : "text-right")}>
            {meta}
          </p>
        )}
      </div>
    </motion.div>
  );
}
