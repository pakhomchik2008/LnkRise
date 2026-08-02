"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { Avatar } from "@/components/ui/avatar";

/**
 * PLACEHOLDER COPY — these are illustrative, not real customers. The section
 * says so on the page. Replace with quotes you have permission to publish
 * before this goes live; presenting invented quotes as real ones is not
 * something to ship by accident.
 */
const QUOTES = [
  {
    quote:
      "I had been writing one post a month and calling it a strategy. The part that actually changed things was the engagement list — turns out the comments were doing more than the posts ever did.",
    name: "Sample Reviewer",
    role: "Platform engineer",
  },
  {
    quote:
      "The profile audit was blunt in a way I needed. It told me my headline was a job title and my About section was a warm-up. Both were true.",
    name: "Sample Reviewer",
    role: "Product manager",
  },
  {
    quote:
      "Twenty minutes in the morning, and I stopped opening the app to scroll. Having the day's three things decided before I arrive is the entire value.",
    name: "Sample Reviewer",
    role: "Independent consultant",
  },
];

export function Testimonials() {
  const [index, setIndex] = React.useState(0);
  const current = QUOTES[index]!;

  const go = (delta: number) => setIndex((value) => (value + delta + QUOTES.length) % QUOTES.length);

  return (
    <section className="border-t border-hairline px-5 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          What it changes, in their words
        </h2>
        <p className="mt-3 text-center text-xs text-ink-muted">
          Illustrative examples — replace with real, permissioned customer quotes before launch.
        </p>

        <div className="relative mt-10 min-h-56">
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, transition: { duration: 0.2, ease: [0.55, 0.06, 0.68, 0.19] } }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-7 shadow-[var(--shadow-sm)]"
            >
              <blockquote className="text-base leading-relaxed text-ink sm:text-lg">
                &ldquo;{current.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Avatar name={current.name} size="md" />
                <span>
                  <span className="block text-sm font-semibold text-ink">{current.name}</span>
                  <span className="block text-xs text-ink-muted">{current.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous quote"
            className="grid size-9 place-items-center rounded-full border border-hairline text-ink-muted transition-colors hover:border-brand-300 hover:text-ink"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex gap-1.5">
            {QUOTES.map((_, dot) => (
              <button
                key={dot}
                type="button"
                onClick={() => setIndex(dot)}
                aria-label={`Go to quote ${dot + 1}`}
                aria-current={dot === index}
                className={
                  dot === index
                    ? "h-1.5 w-6 rounded-full [background:var(--gradient-primary)] transition-all duration-300"
                    : "h-1.5 w-1.5 rounded-full bg-ink/20 transition-all duration-300"
                }
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next quote"
            className="grid size-9 place-items-center rounded-full border border-hairline text-ink-muted transition-colors hover:border-brand-300 hover:text-ink"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
