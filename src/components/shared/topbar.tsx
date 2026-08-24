"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, Flame, Menu, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Logo } from "@/components/shared/logo";
import { Dropdown } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { APP_NAV } from "@/lib/constants";
import { cn, pluralize } from "@/lib/utils";

export interface TopbarProps {
  streak: number;
  notifications: { id: string; title: string; body: string }[];
  plan: string;
}

/**
 * Search jumps between app sections. It deliberately does not pretend to
 * search your content — there is no content index yet, and a box that returns
 * nothing is worse than one that does something small and real.
 */
function SectionSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [focused, setFocused] = React.useState(false);

  const matches = query
    ? APP_NAV.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="relative hidden w-full max-w-xs sm:block">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        placeholder="Jump to…"
        aria-label="Jump to a section"
        className="h-9 w-full rounded-[var(--radius-sm)] border border-hairline bg-surface-muted pl-9 pr-3 text-sm text-ink outline-none transition-colors focus:border-brand-400 focus:bg-surface"
      />

      <AnimatePresence>
        {focused && matches.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-[var(--radius-md)] border border-hairline bg-surface p-1 shadow-[var(--shadow-lg)]"
          >
            {matches.map((item) => (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => {
                    router.push(item.href);
                    setQuery("");
                  }}
                  className="w-full rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm text-ink hover:bg-ink/[0.05]"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="rounded-[var(--radius-sm)] p-2 text-ink md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute inset-y-0 left-0 w-64 border-r border-hairline bg-surface p-4"
            >
              <div className="mb-6 flex items-center justify-between">
                <Logo animate={false} />
                <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation">
                  <X className="size-5 text-ink-muted" />
                </button>
              </div>

              <ul className="space-y-1">
                {APP_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium",
                        pathname === item.href
                          ? "bg-brand-500/10 text-ink"
                          : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function Topbar({ streak, notifications, plan }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-hairline surface-glass px-4 sm:px-6">
      <MobileNav />
      <div className="md:hidden">
        <Logo animate={false} withWordmark={false} />
      </div>

      <SectionSearch />

      <div className="ml-auto flex items-center gap-2">
        {plan !== "pro" && (
          <Link
            href="/billing"
            className="hidden items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-600 sm:inline-flex"
          >
            <Sparkles aria-hidden className="size-4" />
            Choose your plan
          </Link>
        )}

        <Tooltip content={`${streak} ${pluralize(streak, "day", "days")} in a row`}>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              streak > 0
                ? "bg-accent-orange/12 text-orange-700"
                : "bg-ink/[0.05] text-ink-muted",
            )}
          >
            <Flame aria-hidden className="size-3.5" />
            <span className="font-mono tabular-nums">{streak}</span>
          </span>
        </Tooltip>

        <Dropdown
          align="end"
          panelClassName="w-72"
          trigger={
            <span className="relative grid size-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink">
              <Bell aria-hidden className="size-[18px]" />
              {notifications.length > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-accent-pink ring-2 ring-surface" />
              )}
              <span className="sr-only">Notifications</span>
            </span>
          }
        >
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-muted">
              Nothing new. Your brief lands each morning.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((item) => (
                <li key={item.id} className="rounded-[var(--radius-sm)] px-2.5 py-2 hover:bg-ink/[0.04]">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
