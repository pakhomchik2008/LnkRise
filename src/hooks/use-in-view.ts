"use client";

import { useInView as useFramerInView } from "framer-motion";
import * as React from "react";

/**
 * Thin wrapper over framer-motion's useInView with the project's defaults:
 * fire once, and only when the element is meaningfully on screen.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: { amount?: number; margin?: string; once?: boolean } = {},
) {
  const ref = React.useRef<T>(null);
  const inView = useFramerInView(ref, {
    once: options.once ?? true,
    amount: options.amount ?? 0.25,
  });

  return { ref, inView } as const;
}
