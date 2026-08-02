"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageSquare, PenLine, Sparkles, UserPlus, Wrench } from "lucide-react";
import * as React from "react";
import type { TaskPriority, TaskType } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

const TYPE_ICONS: Record<TaskType, React.ElementType> = {
  post: PenLine,
  connect: UserPlus,
  comment: MessageSquare,
  optimize: Wrench,
  engage: Sparkles,
};

const PRIORITY_BARS: Record<TaskPriority, string> = {
  high: "bg-accent-orange",
  medium: "bg-brand-500",
  low: "bg-ink-muted/50",
};

export interface ActionCardProps {
  title: string;
  description?: string | null;
  type: TaskType;
  priority: TaskPriority;
  completed: boolean;
  aiGenerated?: boolean;
  pending?: boolean;
  index?: number;
  onToggle: () => void;
  className?: string;
}

export function ActionCard({
  title,
  description,
  type,
  priority,
  completed,
  aiGenerated = true,
  pending = false,
  index = 0,
  onToggle,
  className,
}: ActionCardProps) {
  const Icon = TYPE_ICONS[type];
  const labelId = React.useId();

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "relative flex gap-3 overflow-hidden rounded-[var(--radius-md)] border p-3.5",
        "transition-colors duration-300",
        completed ? "border-hairline bg-surface-muted" : "border-hairline bg-surface",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-[3px] transition-opacity duration-300",
          PRIORITY_BARS[priority],
          completed && "opacity-30",
        )}
      />

      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        aria-labelledby={labelId}
        disabled={pending}
        onClick={onToggle}
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors duration-150",
          completed
            ? "border-transparent [background:var(--gradient-success)]"
            : "border-hairline hover:border-brand-400",
          pending && "opacity-50",
        )}
      >
        <AnimatePresence>
          {completed && (
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Check aria-hidden className="size-3.5 text-white" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            id={labelId}
            className={cn(
              "text-sm font-medium transition-colors duration-300",
              completed ? "text-ink-muted line-through" : "text-ink",
            )}
          >
            {title}
          </p>
          <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
        </div>

        {description && (
          <p className={cn("mt-1 text-xs leading-relaxed text-ink-muted", completed && "opacity-60")}>
            {description}
          </p>
        )}

        {aiGenerated && !completed && (
          <Badge tone="info" className="mt-2">
            AI pick
          </Badge>
        )}
      </div>
    </motion.li>
  );
}
