"use client";

import { animate, useReducedMotion } from "framer-motion";
import * as React from "react";

export interface UseAnimatedCounterOptions {
  duration?: number;
  decimals?: number;
  /** Hold at 0 until this flips true — pair with useInView for scroll triggers. */
  start?: boolean;
}

/**
 * Counts from 0 to `value`. Returns the current display value, already rounded.
 * Respects prefers-reduced-motion by jumping straight to the target.
 */
export function useAnimatedCounter(
  value: number,
  { duration = 1.2, decimals = 0, start = true }: UseAnimatedCounterOptions = {},
): number {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = React.useState(reduceMotion ? value : 0);

  React.useEffect(() => {
    if (!start) return;

    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (latest) => {
        const factor = 10 ** decimals;
        setDisplay(Math.round(latest * factor) / factor);
      },
    });

    return () => controls.stop();
  }, [value, duration, decimals, start, reduceMotion]);

  return display;
}
