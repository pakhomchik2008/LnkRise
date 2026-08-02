"use client";

import { motion } from "framer-motion";
import { BarChart3, MessageSquare, PenLine, Sparkles, Sunrise, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Sunrise,
    title: "The morning brief",
    body: "One focus, one post idea with a finished draft, three outreach targets, two conversations worth joining. Regenerated daily against your plan.",
  },
  {
    icon: PenLine,
    title: "Writing workspace",
    body: "Draft alongside the coach, see the preview and the cut-off point, and get a read on your hook before anyone else sees it.",
    premium: true,
  },
  {
    icon: BarChart3,
    title: "Growth analytics",
    body: "Views, impressions, followers and connections in one place, with the weekly read on what actually moved and why.",
  },
  {
    icon: Users,
    title: "Outreach strategy",
    body: "Categories of people worth knowing, the search that finds them, and a first message that references something real.",
  },
  {
    icon: MessageSquare,
    title: "Engagement coach",
    body: "Where to show up in other people's comment sections — the highest-return activity nobody plans for.",
  },
  {
    icon: Sparkles,
    title: "Profile audit",
    body: "An honest score per section with the specific edits to make. No inflated numbers — an empty About section scores like an empty About section.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-hairline bg-surface-muted/50 px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Six tools that would otherwise be six subscriptions
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            Writing help, analytics, profile advice and outreach usually live in separate products
            that never talk to each other. Here they share one plan.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: (index % 3) * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -4, boxShadow: "var(--shadow-lg)" }}
              className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-brand-500/10 text-brand-600">
                  <feature.icon aria-hidden className="size-5" />
                </span>
                {feature.premium && <Badge tone="premium">Pro</Badge>}
              </div>

              <h3 className="mt-4 text-base font-semibold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
