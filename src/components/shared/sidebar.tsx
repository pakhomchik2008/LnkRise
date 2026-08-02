"use client";

import { AnimatePresence, motion } from "framer-motion";
import * as icons from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Logo, LogoMark } from "@/components/shared/logo";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { APP_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  user: { name: string | null; email: string; image: string | null };
  plan: string;
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (icons as unknown as Record<string, icons.LucideIcon>)[name] ?? icons.Circle;
  return <Icon aria-hidden className={className} />;
}

export function Sidebar({ user, plan }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-hairline bg-surface md:flex",
        "transition-[width] duration-300",
        collapsed ? "w-[68px]" : "w-60",
      )}
    >
      <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-0")}>
        <Link href="/dashboard" aria-label="Dashboard">
          {collapsed ? <LogoMark size={26} /> : <Logo />}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {APP_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const link = (
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium",
                "transition-colors duration-150",
                active ? "text-ink" : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink",
                collapsed && "justify-center px-0",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute inset-0 rounded-[var(--radius-sm)] bg-brand-500/10"
                />
              )}
              <NavIcon name={item.icon} className="relative z-10 size-[18px] shrink-0" />
              {!collapsed && (
                <>
                  <span className="relative z-10 flex-1">{item.label}</span>
                  {item.premium && (
                    <Badge tone="premium" className="relative z-10 px-1.5 py-0 text-[10px]">
                      Pro
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );

          return (
            <div key={item.href}>
              {collapsed ? <Tooltip content={item.label} placement="right">{link}</Tooltip> : link}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-hairline p-3">
        <Dropdown
          side="top"
          trigger={
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-[var(--radius-sm)] p-2 transition-colors hover:bg-ink/[0.04]",
                collapsed && "justify-center p-1",
              )}
            >
              <Avatar name={user.name} email={user.email} src={user.image} size="md" status="online" />
              {!collapsed && (
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium text-ink">
                    {user.name ?? user.email}
                  </span>
                  <span className="block truncate text-[11px] capitalize text-ink-muted">
                    {plan} plan
                  </span>
                </span>
              )}
            </div>
          }
          panelClassName="w-52"
        >
          <Link
            href="/settings"
            role="menuitem"
            className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-ink transition-colors hover:bg-ink/[0.05]"
          >
            <icons.Settings aria-hidden className="size-4 text-ink-muted" />
            Settings
          </Link>
          <Link
            href="/billing"
            role="menuitem"
            className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-ink transition-colors hover:bg-ink/[0.05]"
          >
            <icons.CreditCard aria-hidden className="size-4 text-ink-muted" />
            Billing
          </Link>
          <DropdownSeparator />
          <DropdownItem
            icon={<icons.LogOut className="size-4" />}
            destructive
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </DropdownItem>
        </Dropdown>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mt-2 flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-xs",
            "text-ink-muted transition-colors hover:bg-ink/[0.04] hover:text-ink",
            collapsed && "justify-center px-0",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={collapsed ? "expand" : "collapse"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {collapsed ? (
                <icons.PanelLeftOpen className="size-4" />
              ) : (
                <icons.PanelLeftClose className="size-4" />
              )}
            </motion.span>
          </AnimatePresence>
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
