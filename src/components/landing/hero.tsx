"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "./dashboard-mockup";

const ENTRANCE = { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } as const;

function GradientMesh() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-brand-500/20 blur-3xl [animation:var(--animate-drift)]" />
      <div className="absolute -right-32 top-10 size-[28rem] rounded-full bg-violet-brand/20 blur-3xl [animation:var(--animate-drift)] [animation-delay:-7s]" />
      <div className="absolute bottom-0 left-1/3 size-[26rem] rounded-full bg-accent-cyan/15 blur-3xl [animation:var(--animate-drift)] [animation-delay:-14s]" />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-16 sm:pt-24">
      <GradientMesh />

      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ENTRANCE}
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-ink-muted"
          >
            <span className="size-1.5 rounded-full bg-accent-green" />
            Built for people who have twenty minutes, not twenty hours
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ENTRANCE, delay: 0.08 }}
            className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            Stop guessing what to post.
            <br />
            <span className="text-gradient-accent">Get a plan every morning.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ENTRANCE, delay: 0.16 }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg"
          >
            LnkRise reads your profile, your goal and the people you admire, then hands you one
            concrete plan a day: what to write, who to reach out to, what to reply to — and whether
            any of it is working.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ENTRANCE, delay: 0.24 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href="/signup">
              <Button size="lg" icon={<ArrowRight className="size-4" />} iconPosition="right">
                Start free — 3 days
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="secondary">
                See pricing
              </Button>
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...ENTRANCE, delay: 0.32 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-ink-muted"
          >
            {["No card required", "Cancel any time", "Your data stays yours"].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <Check aria-hidden className="size-3.5 text-accent-green" />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-16"
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
