"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/case-studies", label: "Case studies" },
  { href: "/#faq", label: "FAQ" },
];

export function MarketingNav() {
  const { scrollY } = useScroll();
  const shadow = useTransform(scrollY, [0, 60], ["0 0 0 rgba(0,0,0,0)", "var(--shadow-sm)"]);
  const [open, setOpen] = React.useState(false);

  return (
    <motion.header
      style={{ boxShadow: shadow }}
      className="sticky top-0 z-40 w-full border-b border-hairline surface-glass"
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" aria-label="LnkRise home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start free</Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="rounded-[var(--radius-sm)] p-2 text-ink md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn("overflow-hidden border-t border-hairline bg-surface md:hidden", !open && "pointer-events-none")}
      >
        <div className="flex flex-col gap-1 px-5 py-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-ink/[0.04] hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2">
            <Link href="/login" className="flex-1">
              <Button variant="secondary" className="w-full">
                Sign in
              </Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button className="w-full">Start free</Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}
