"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { APP_NAME } from "@/lib/constants";
import { joinWaitlist } from "@/app/(marketing)/actions";

export function FinalCta() {
  return (
    <section className="px-5 py-20">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mx-auto max-w-4xl overflow-hidden rounded-[var(--radius-xl)] px-8 py-14 text-center [background:var(--gradient-primary)]"
      >
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Tomorrow morning, you could already know what to write
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/80">
          Six questions, two minutes, and the first plan is ready before you finish your coffee.
        </p>
        <Link href="/signup" className="mt-8 inline-block">
          <Button
            size="lg"
            className="bg-white text-brand-700 [background:white] hover:shadow-[var(--shadow-lg)]"
            icon={<ArrowRight className="size-4" />}
            iconPosition="right"
          >
            Start free — 3 days
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}

function NewsletterForm() {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await joinWaitlist(formData);
    setPending(false);

    if (result.ok) {
      toast({ tone: "success", title: "You are on the list", description: "One email a week, no more." });
    } else {
      setError(result.error);
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        name="email"
        type="email"
        label="Email"
        required
        error={error}
        className="sm:max-w-64"
      />
      <Button type="submit" loading={pending} className="sm:h-14">
        Subscribe
      </Button>
    </form>
  );
}

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/#how-it-works", label: "How it works" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create account" },
    ],
  },
];

export function Footer() {
  return (
    <footer data-surface="dark" className="px-5 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Logo animate={false} />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
              A daily coaching plan for building a professional presence — written for your field,
              sized to the time you actually have.
            </p>
            <div className="mt-5 max-w-sm">
              <p className="mb-2 text-xs font-semibold text-ink">One useful email a week</p>
              <NewsletterForm />
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <p className="text-xs font-semibold tracking-wide text-ink">{column.heading}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-hairline pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Not affiliated with, endorsed by, or connected
            to any professional networking platform.
          </p>
          <p>Built to work with the platforms&rsquo; rules, not around them.</p>
        </div>
      </div>
    </footer>
  );
}
