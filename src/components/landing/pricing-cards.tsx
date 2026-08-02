"use client";

import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PricingCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("grid gap-5 lg:grid-cols-3", compact && "gap-4")}>
      {PLANS.map((plan, index) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            "relative flex flex-col rounded-[var(--radius-lg)] border bg-surface p-6",
            plan.highlighted
              ? "border-brand-400 shadow-[var(--shadow-glow)]"
              : "border-hairline shadow-[var(--shadow-sm)]",
          )}
        >
          {plan.highlighted && (
            <Badge tone="premium" className="absolute -top-2.5 left-6">
              Most popular
            </Badge>
          )}

          <h3 className="text-sm font-semibold text-ink">{plan.name}</h3>
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-bold text-ink">{plan.price}</span>
            <span className="text-sm text-ink-muted">{plan.priceNote}</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{plan.tagline}</p>

          <ul className="mt-6 flex-1 space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-ink">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-green" />
                {feature}
              </li>
            ))}
            {plan.missing.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-muted">
                <Minus aria-hidden className="mt-0.5 size-4 shrink-0 opacity-50" />
                {feature}
              </li>
            ))}
          </ul>

          <Link href="/signup" className="mt-6 block">
            <Button className="w-full" variant={plan.highlighted ? "primary" : "secondary"} size="lg">
              {plan.cta}
            </Button>
          </Link>

          <p className="mt-3 text-center text-[11px] text-ink-muted">
            {plan.billing === "one_time"
              ? `One payment, ${plan.durationDays} days of access`
              : "Monthly, cancel any time"}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-hairline px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Priced like a habit, not a platform
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            Start with three days free. If the plan is not better than what you would have done on
            your own, stop — that is the whole test.
          </p>
        </motion.div>

        <div className="mt-12">
          <PricingCards />
        </div>
      </div>
    </section>
  );
}
