import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { PLANS, effectivePlan } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { stripeEnabled } from "@/lib/stripe";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/50">{sub}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const week = new Date(now.getTime() - 7 * day);
  const month = new Date(now.getTime() - 30 * day);

  const [totalUsers, activeUsers, signupsWeek, signupsMonth, avg, coaches, admins, topUsers, briefsToday] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastActiveAt: { gte: week } } }),
    prisma.user.count({ where: { createdAt: { gte: week } } }),
    prisma.user.count({ where: { createdAt: { gte: month } } }),
    prisma.user.aggregate({ _avg: { growthScore: true }, where: { onboardedAt: { not: null } } }),
    prisma.user.count({ where: { role: "coach" } }),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.user.findMany({
      where: { onboardedAt: { not: null } },
      orderBy: [{ growthScore: "desc" }, { streak: "desc" }],
      take: 5,
      select: { id: true, name: true, email: true, growthScore: true, streak: true },
    }),
    prisma.dailyBrief.count({ where: { date: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } } }),
  ]);

  const avgScore = avg._avg.growthScore ? Math.round(avg._avg.growthScore) : 0;

  const revenue = stripeEnabled() ? await revenueSummary() : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Overview</h1>
        <p className="mt-1 text-sm text-white/60">Live counts from the database. Nothing sampled or estimated.</p>
      </header>

      <section aria-label="User counts" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} sub={`${admins} admin, ${coaches} coach`} />
        <StatCard label="Active (7d)" value={activeUsers} sub={totalUsers ? `${Math.round((activeUsers / totalUsers) * 100)}% of total` : "—"} />
        <StatCard label="Signups (7d)" value={signupsWeek} />
        <StatCard label="Signups (30d)" value={signupsMonth} />
      </section>

      <section aria-label="Product health" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Avg growth score" value={avgScore} sub="onboarded accounts only" />
        <StatCard label="Briefs today" value={briefsToday} />
        <StatCard label="Coaches" value={coaches} sub="white-label agencies" />
      </section>

      <section aria-label="Revenue">
        {revenue ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="MRR" value={`$${revenue.mrr}`} sub="active Pro subscriptions" />
            <StatCard label="Pro subscribers" value={revenue.proCount} />
            <StatCard label="Starter passes (active)" value={revenue.starterCount} />
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start gap-3">
              <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-white/40" />
              <div>
                <p className="text-sm font-semibold text-white">Revenue metrics not wired</p>
                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  Stripe is not connected on this deployment, so MRR, churn and LTV would be invented if
                  this card claimed them. Add the Stripe env vars and this section fills in.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section aria-label="Top users">
        <h2 className="mb-3 text-sm font-semibold text-white">Top by growth score</h2>
        {topUsers.length === 0 ? (
          <p className="text-sm text-white/60">Nobody has finished onboarding yet.</p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03]">
            {topUsers.map((u, i) => (
              <li key={u.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-4 font-mono text-xs text-white/40">{i + 1}</span>
                  <div className="min-w-0">
                    <Link href={`/admin/users/${u.id}`} className="block truncate font-medium text-white hover:underline">
                      {u.name ?? u.email}
                    </Link>
                    <p className="truncate text-xs text-white/50">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/70">
                  <span className="tabular-nums">score {u.growthScore}</span>
                  <span className="tabular-nums">{u.streak}d streak</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function revenueSummary(): Promise<{ mrr: number; proCount: number; starterCount: number }> {
  const subscriptions = await prisma.subscription.findMany({
    where: { plan: { in: ["starter", "pro"] } },
    select: { plan: true, status: true, currentPeriodEnd: true },
  });

  const active = subscriptions.filter((s) => effectivePlan(s) !== "trial");
  const proCount = active.filter((s) => effectivePlan(s) === "pro").length;
  const starterCount = active.filter((s) => effectivePlan(s) === "starter").length;

  const proPrice = Number(PLANS.find((p) => p.id === "pro")?.price.replace(/[^0-9.]/g, "") ?? 0);

  return { mrr: proCount * proPrice, proCount, starterCount };
}
