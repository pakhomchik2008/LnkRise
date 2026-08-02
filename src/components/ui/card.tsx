"use client";

import { motion, type Variants } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "glass" | "gradient-border";

type NativeDivProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onAnimationStart" | "onAnimationEnd" | "onDrag" | "onDragStart" | "onDragEnd" | "ref"
>;

export interface CardProps extends NativeDivProps {
  variant?: CardVariant;
  hover?: boolean;
  /** Stagger index — multiplies the entrance delay. */
  index?: number;
  as?: "div" | "section" | "article" | "li";
}

export const cardEntrance: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const VARIANTS: Record<CardVariant, string> = {
  default: "bg-surface border border-hairline shadow-[var(--shadow-sm)]",
  glass: "surface-glass border border-hairline shadow-[var(--shadow-sm)]",
  "gradient-border": "gradient-border shadow-[var(--shadow-sm)]",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant = "default", hover = false, index = 0, children, ...props },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      custom={index}
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      whileHover={hover ? { y: -4, boxShadow: "var(--shadow-lg)" } : undefined}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn("rounded-[var(--radius-md)] p-5", VARIANTS[variant], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
});

export function CardHeader({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mb-4 flex items-start justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentPropsWithoutRef<"h3">) {
  return <h3 className={cn("text-base font-semibold text-ink", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentPropsWithoutRef<"p">) {
  return <p className={cn("text-sm text-ink-muted", className)} {...props} />;
}
