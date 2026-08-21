"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    number: "01",
    title: "Answer six questions",
    body: "A short conversation, not a form. Where you are, where you want to be, and who you already admire. Two minutes.",
  },
  {
    number: "02",
    title: "Get your plan",
    body: "A read on your profile, a four-week strategy, and tomorrow morning's actions — written for your field, not for everyone.",
  },
  {
    number: "03",
    title: "Do the twenty minutes",
    body: "One post idea, three people to reach out to, two conversations to join. Tick them off. Watch the numbers move.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-hairline px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mx-auto mt-12 max-w-2xl text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl"
        >
          Three steps, then it runs every morning
        </motion.h2>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative rounded-[var(--radius-lg)] border border-hairline bg-surface p-6"
            >
              <span className="font-mono text-sm font-semibold text-brand-500">{step.number}</span>
              <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
