import { NextResponse } from "next/server";
import { sendEmail, emailEnabled } from "@/lib/email/send";
import { postReminderEmailHtml, postReminderSubject } from "@/lib/email/templates/post-reminder";
import { prisma } from "@/lib/prisma";

/**
 * Mails a "time to post" reminder for every scheduled post whose time has
 * arrived. Runs hourly, alongside the daily-brief cron — see that route for
 * why hourly rather than a single fixed time.
 *
 * This never publishes anything. The official API is not approved for
 * w_member_social, so there is no auto-post path; the reminder exists so the
 * user sees the exact text at the right moment and pastes it in themselves.
 * `status` stays "scheduled" after the reminder goes out — only the user
 * moving it to "published" (via the normal publish flow, once available)
 * changes that.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 10;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[cron] CRON_SECRET is not set — refusing to run");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const due = await prisma.post.findMany({
    where: { status: "scheduled", scheduledAt: { lte: now }, reminderSentAt: null },
    select: {
      id: true,
      content: true,
      userId: true,
      user: { select: { email: true, name: true, emailBriefEnabled: true } },
    },
    take: 200, // hourly, so a run can only ever fall this far behind under a real outage
  });

  // optedOut and dryRun are both reasons no mail went out, but they mean
  // opposite things for an operator reading this response — one is the user's
  // choice, the other is the deployment's. Keeping them apart is the entire
  // value of the stat.
  const stats = { due: due.length, emailed: 0, optedOut: 0, dryRun: 0, failed: 0 };

  for (let index = 0; index < due.length; index += BATCH_SIZE) {
    const batch = due.slice(index, index + BATCH_SIZE);

    await Promise.all(
      batch.map(async (post) => {
        // Respecting the same opt-out as the morning brief — a user who
        // turned off email does not want this one either.
        if (!post.user.emailBriefEnabled) {
          stats.optedOut += 1;
          return;
        }

        const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

        const result = await sendEmail({
          to: post.user.email,
          subject: postReminderSubject(),
          html: postReminderEmailHtml({
            name: post.user.name?.split(" ")[0] ?? "there",
            content: post.content,
            editorUrl: `${base}/content/editor?post=${post.id}`,
          }),
        });

        if (result.status === "failed") {
          console.error(`[cron] reminder for post ${post.id} failed: ${result.error}`);
          stats.failed += 1;
          return;
        }

        // A dry run must not mark the reminder as sent, or turning the key
        // on later would silently skip every post scheduled before that.
        if (result.status === "skipped") {
          stats.dryRun += 1;
          return;
        }

        await prisma.post.update({ where: { id: post.id }, data: { reminderSentAt: now } });
        stats.emailed += 1;
      }),
    );
  }

  return NextResponse.json({
    ok: true,
    ranAt: now.toISOString(),
    emailDelivery: emailEnabled() ? "live" : "dry-run",
    ...stats,
  });
}
