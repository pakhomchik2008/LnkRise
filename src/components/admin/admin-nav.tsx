"use client";

import { BarChart3, FileText, LayoutDashboard, LogOut, Users } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/content", label: "Content", icon: FileText },
];

export function AdminNav({ userLabel }: { userLabel: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-white/10 bg-ink px-3 py-6 md:flex">
      <div className="px-3 pb-6">
        <Link href="/admin" className="text-base font-bold tracking-tight text-white">
          LnkRise <span className="text-white/40">/ admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors duration-150",
                active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon aria-hidden className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 pt-4">
        <p className="px-3 text-xs text-white/40">Signed in</p>
        <p className="mt-0.5 truncate px-3 text-xs font-semibold text-white/80">{userLabel}</p>

        <div className="mt-3 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Back to the app
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut aria-hidden className="size-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
