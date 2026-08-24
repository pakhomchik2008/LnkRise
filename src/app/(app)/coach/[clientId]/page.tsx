import { notFound, redirect } from "next/navigation";
import { BriefOverridePanel, CoachNotesPanel } from "@/components/coach/client-detail-panels";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { requireCoachId } from "@/lib/auth";
import { fromJson } from "@/lib/prisma";
import { prisma } from "@/lib/prisma";
import { toUtcDay } from "@/lib/utils";
import type { DailyBriefContent } from "@/types";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </Card>
  );
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  let coachId: string;
  try {
    coachId = await requireCoachId();
  } catch {
    redirect("/dashboard");
  }

  const client = await prisma.user.findFirst({
    where: { id: clientId, coachId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      growthScore: true,
      streak: true,
      onboardedAt: true,
      lastActiveAt: true,
    },
  });

  if (!client) notFound();

  const [latestBrief, postCount, factCount, notes, todaysBrief] = await Promise.all([
    prisma.dailyBrief.findFirst({
      where: { userId: clientId },
      orderBy: { date: "desc" },
      select: { date: true, content: true },
    }),
    prisma.post.count({ where: { userId: clientId } }),
    prisma.fact.count({ where: { userId: clientId } }),
    prisma.coachNote.findMany({
      where: { coachId, clientId },
      orderBy: { createdAt: "desc" },
      select: { id: true, body: true, createdAt: true },
    }),
    prisma.dailyBrief.findUnique({
      where: { userId_date: { userId: clientId, date: toUtcDay() } },
      select: { content: true },
    }),
  ]);

  const briefContent = latestBrief ? fromJson<DailyBriefContent>(latestBrief.content) : null;
  const todaysContent = todaysBrief ? fromJson<DailyBriefContent>(todaysBrief.content) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <Avatar name={client.name} email={client.email} src={client.image} size="lg" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">{client.name ?? client.email}</h1>
          <p className="text-sm text-ink-muted">{client.email}</p>
        </div>
      </div>

      {!client.onboardedAt ? (
        <Card className="mt-6 p-5 text-sm text-ink-muted">
          Not onboarded yet — nothing to show until they finish the questionnaire.
        </Card>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Metric label="Growth score" value={client.growthScore} />
            <Metric label="Streak" value={`${client.streak}d`} />
            <Metric label="Posts drafted" value={postCount} />
          </div>

          <Card className="mt-4 p-5">
            <h2 className="text-sm font-semibold text-ink">Latest brief</h2>
            {briefContent ? (
              <div className="mt-3 space-y-2 text-sm text-ink-muted">
                <p>
                  <span className="font-medium text-ink">Focus:</span> {briefContent.todayFocus}
                </p>
                {briefContent.postIdea && (
                  <p>
                    <span className="font-medium text-ink">Post idea:</span> {briefContent.postIdea.topic}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">No brief generated yet.</p>
            )}
          </Card>

          <p className="mt-4 text-xs text-ink-muted">
            {factCount} fact{factCount === 1 ? "" : "s"} on file · last active{" "}
            {client.lastActiveAt ? client.lastActiveAt.toLocaleDateString() : "never"}
          </p>

          <BriefOverridePanel
            clientId={client.id}
            defaults={
              todaysContent
                ? {
                    todayFocus: todaysContent.todayFocus,
                    postTopic: todaysContent.postIdea.topic,
                    postHook: todaysContent.postIdea.hook,
                    optimizationTitle: todaysContent.optimizationTip.title,
                    optimizationDetail: todaysContent.optimizationTip.detail,
                  }
                : null
            }
          />

          <CoachNotesPanel
            clientId={client.id}
            notes={notes.map((note) => ({
              id: note.id,
              body: note.body,
              createdAt: note.createdAt.toLocaleString(),
            }))}
          />
        </>
      )}
    </div>
  );
}
