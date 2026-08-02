"use client";

import { motion } from "framer-motion";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The mark is three rising strokes resolving into an arc — original geometry,
 * deliberately unrelated to any platform's branding.
 */
// A fixed id rather than useId(): the gradient is identical for every mark, and
// a per-instance id makes the SSR and client markup disagree on hydration.
const GRADIENT_ID = "lnkrise-mark-gradient";

export function LogoMark({ size = 28, animate = true }: { size?: number; animate?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={`${APP_NAME} logo`}
    >
      <defs>
        <linearGradient id={GRADIENT_ID} x1="0" y1="32" x2="32" y2="0">
          <stop offset="0%" stopColor="#2b59ff" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      <motion.rect
        x="3"
        y="19"
        width="6"
        height="10"
        rx="3"
        fill={`url(#${GRADIENT_ID})`}
        initial={animate ? { scaleY: 0 } : false}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
      />
      <motion.rect
        x="13"
        y="12"
        width="6"
        height="17"
        rx="3"
        fill={`url(#${GRADIENT_ID})`}
        initial={animate ? { scaleY: 0 } : false}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
      />
      <motion.rect
        x="23"
        y="3"
        width="6"
        height="26"
        rx="3"
        fill={`url(#${GRADIENT_ID})`}
        initial={animate ? { scaleY: 0 } : false}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
      />
      <motion.path
        d="M4 22 C 10 22, 16 15, 26 5"
        stroke={`url(#${GRADIENT_ID})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 0.45 }}
        transition={{ duration: 0.9, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </svg>
  );
}

export function Logo({
  size = 28,
  animate = true,
  withWordmark = true,
  className,
}: {
  size?: number;
  animate?: boolean;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} animate={animate} />
      {withWordmark && (
        <motion.span
          initial={animate ? { opacity: 0, x: -6 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-[17px] font-bold tracking-tight text-ink"
        >
          {APP_NAME}
        </motion.span>
      )}
    </span>
  );
}
