import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { BriefCards } from "@/components/dashboard/brief-section";
import { TodayActions } from "@/components/dashboard/today-actions";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toUtcDay } from "@/lib/utils";
import type { CoachingTaskView, DailyBriefContent, TaskPriority, TaskType } from "@/types";

export const metadata: Metadata = {
  title: "Daily brief",
  robots: { index: false, follow: false },
};

export default async function DailyBriefPage() {
  const userId = await requireUserId();
  const today = toUtcDay();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardedAt: true },
  });

  if (!user?.onboardedAt) redirect("/onboarding");

  const [brief, tasks, history] = await Promise.all([
    prisma.dailyBrief.findUnique({
      where: { userId_date: { userId, date: today } },
      select: { content: true },
    }),
    prisma.coachingTask.findMany({
      where: { userId, createdAt: { gte: today } },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      select: { id: true, type: true, title: true, description: true, priority: true, status: true },
    }),
    prisma.dailyBrief.findMany({
      where: { userId, date: { lt: today } },
      orderBy: { date: "desc" },
      take: 7,
      select: { id: true, date: true, content: true, completed: true },
    }),
  ]);

  const content = (brief?.content ?? undefined) as unknown as DailyBriefContent | undefined;

  const taskViews: CoachingTaskView[] = tasks.map((task) => ({
    id: task.id,
    type: task.type as TaskType,
    title: task.title,
    description: task.description,
    priority: task.priority as TaskPriority,
    status: task.status as CoachingTaskView["status"],
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Today&rsquo;s brief</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {format(new Date(), "EEEE d MMMM")}
          {content ? ` · ${content.todayFocus}` : ""}
        </p>
      </header>

      {content ? (
        <>
          <TodayActions tasks={taskViews} />
          <BriefCards content={content} />

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Optimise one thing</CardTitle>
                <CardDescription>{content.optimizationTip.title}</CardDescription>
              </div>
            </CardHeader>
            <p className="text-sm leading-relaxed text-ink">{content.optimizationTip.detail}</p>
          </Card>
        </>
      ) : (
        <EmptyState
          title="No brief for today yet"
          description="Briefs are generated each morning. If you have just finished onboarding, the first one is already on your dashboard."
        />
      )}

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Earlier briefs</h2>
          <ul className="space-y-2">
            {history.map((entry) => {
              const past = entry.content as unknown as DailyBriefContent;
              const done = (entry.completed as Record<string, unknown>)?.dayComplete === true;

              return (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-hairline bg-surface p-4"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-ink-muted">
                      {format(entry.date, "d MMM")}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-ink">
                      {past.postIdea.topic}
                    </p>
                  </div>
                  <span
                    className={
                      done
                        ? "shrink-0 rounded-full bg-accent-green/12 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700"
                        : "shrink-0 rounded-full bg-ink/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted"
                    }
                  >
                    {done ? "Completed" : "Skipped"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
