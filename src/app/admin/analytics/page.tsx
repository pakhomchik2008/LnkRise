import { PlatformSignupChart } from "@/components/admin/platform-signup-chart";
import { prisma } from "@/lib/prisma";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/50">{sub}</p>}
    </div>
  );
}

function pct(part: number, whole: number): string {
  if (!whole) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const start30 = new Date(now.getTime() - 30 * day);
  const start7 = new Date(now.getTime() - 7 * day);

  const cohorts = await Promise.all(
    [1, 7, 30].map(async (n) => {
      const cutoff = new Date(now.getTime() - n * day);
      const cohortStart = new Date(now.getTime() - 2 * n * day);
      // "Signed up between 2n and n days ago; still active in the last n days."
      const cohort = await prisma.user.count({
        where: { createdAt: { gte: cohortStart, lt: cutoff } },
      });
      const retained = await prisma.user.count({
        where: {
          createdAt: { gte: cohortStart, lt: cutoff },
          lastActiveAt: { gte: cutoff },
        },
      });
      return { window: n, cohort, retained };
    }),
  );

  const [signups30, briefs7, tasksTotal, tasksDone, postsPublished7, factsTotal] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: start30 } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.dailyBrief.count({ where: { date: { gte: start7 } } }),
    prisma.coachingTask.count(),
    prisma.coachingTask.count({ where: { status: "completed" } }),
    prisma.post.count({ where: { status: "published", publishedAt: { gte: start7 } } }),
    prisma.fact.count(),
  ]);

  const buckets: Record<string, number> = {};
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(now.getTime() - (29 - i) * day);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const signup of signups30) {
    const key = signup.createdAt.toISOString().slice(0, 10);
    if (key in buckets) buckets[key] = (buckets[key] ?? 0) + 1;
  }

  const series = Object.entries(buckets).map(([date, count]) => ({ date: date.slice(5), count }));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Platform analytics</h1>
        <p className="mt-1 text-sm text-white/60">
          Retention cohorts are approximate — they measure &ldquo;signed up in the window before, still active
          in the window after.&rdquo; Nothing here is estimated or extrapolated.
        </p>
      </header>

      <section aria-label="Retention" className="grid grid-cols-3 gap-3">
        {cohorts.map((cohort) => (
          <StatCard
            key={cohort.window}
            label={`D${cohort.window} retention`}
            value={pct(cohort.retained, cohort.cohort)}
            sub={`${cohort.retained} of ${cohort.cohort} cohort`}
          />
        ))}
      </section>

      <section aria-label="Signups over time">
        <h2 className="mb-3 text-sm font-semibold text-white">Signups, last 30 days</h2>
        <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] p-5">
          <PlatformSignupChart data={series} />
        </div>
      </section>

      <section aria-label="Feature usage" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Briefs (7d)" value={briefs7} />
        <StatCard
          label="Tasks completion"
          value={pct(tasksDone, tasksTotal)}
          sub={`${tasksDone} / ${tasksTotal} all-time`}
        />
        <StatCard label="Posts published (7d)" value={postsPublished7} />
        <StatCard label="Facts on file" value={factsTotal} />
      </section>
    </div>
  );
}
