import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ensureBriefForUser } from "@/lib/brief-service";
import { sendEmail, emailEnabled } from "@/lib/email/send";
import { dailyBriefEmailHtml, dailyBriefSubject } from "@/lib/email/templates/daily-brief";
import { prisma } from "@/lib/prisma";
import { toUtcDay } from "@/lib/utils";
import type { DailyBriefContent } from "@/types";

/**
 * Builds the day's brief for everyone due one, and mails it.
 *
 * Runs hourly rather than once at 06:00 UTC. The spec asked for both a fixed
 * UTC time and a per-user send hour, which cannot both hold: 07:00 local is a
 * different UTC hour for every timezone. Hourly + an equality check on the
 * user's local hour is what makes the per-user setting real.
 *
 * Brief *dates* stay on UTC days (toUtcDay), matching every read path in the
 * app. A user far enough east receives their brief while UTC is still on the
 * previous date, and their dashboard — which also reads in UTC — shows the
 * same row, so the two agree even though neither matches the wall clock.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Users per batch. Keeps generation off the model's rate limit and the function inside its timeout. */
const BATCH_SIZE = 5;

function localHour(timezone: string, now: Date): number | null {
  try {
    const hour = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(now);
    const parsed = Number(hour);
    return Number.isFinite(parsed) ? parsed % 24 : null;
  } catch {
    // An invalid tz string in the DB must not take the whole run down.
    return null;
  }
}

/** One retry, per the spec — a second failure is logged and the user is skipped, not retried forever. */
async function withRetry<T>(label: string, run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (first) {
    console.warn(`[cron] ${label} failed, retrying`, first);
    try {
      return await run();
    } catch (second) {
      console.error(`[cron] ${label} failed twice, skipping`, second);
      return null;
    }
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Without a configured secret the endpoint stays closed rather than open:
  // it generates briefs and sends mail, so an unauthenticated caller could
  // burn the AI budget and spam users.
  if (!secret) {
    console.error("[cron] CRON_SECRET is not set — refusing to run");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = toUtcDay(now);

  const candidates = await prisma.user.findMany({
    // strategy is a Json column, so "has a value" is DbNull, not null —
    // plain null would mean the JSON literal `null` here.
    where: { onboardedAt: { not: null }, strategy: { not: Prisma.DbNull } },
    select: {
      id: true,
      email: true,
      name: true,
      timezone: true,
      emailBriefHour: true,
      emailBriefEnabled: true,
      growthScore: true,
      streak: true,
    },
  });

  const due = candidates.filter((user) => localHour(user.timezone, now) === user.emailBriefHour);

  const stats = { due: due.length, generated: 0, existed: 0, emailed: 0, skipped: 0, failed: 0 };

  for (let index = 0; index < due.length; index += BATCH_SIZE) {
    const batch = due.slice(index, index + BATCH_SIZE);

    await Promise.all(
      batch.map(async (user) => {
        const result = await withRetry(`brief for ${user.id}`, () =>
          ensureBriefForUser(user.id, today),
        );

        if (!result) {
          stats.failed += 1;
          return;
        }

        if (result.status === "skipped") {
          stats.skipped += 1;
          return;
        }

        if (result.status === "created") stats.generated += 1;
        else stats.existed += 1;

        if (!user.emailBriefEnabled) return;

        const sent = await sendBrief(user, result.content, today);
        if (sent) stats.emailed += 1;
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

async function sendBrief(
  user: { id: string; email: string; name: string | null; growthScore: number; streak: number },
  content: DailyBriefContent,
  today: Date,
) {
  const brief = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
    select: { id: true, emailSent: true },
  });

  // Never mail the same brief twice, however often the cron is re-run.
  if (!brief || brief.emailSent) return false;

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const result = await sendEmail({
    to: user.email,
    subject: dailyBriefSubject(content),
    html: dailyBriefEmailHtml({
      name: user.name?.split(" ")[0] ?? "there",
      brief: content,
      growthScore: user.growthScore,
      streak: user.streak,
      briefUrl: `${base}/daily-brief`,
      settingsUrl: `${base}/settings`,
    }),
  });

  if (result.status === "failed") {
    console.error(`[cron] email to ${user.id} failed: ${result.error}`);
    return false;
  }

  // A dry run must not mark the brief as mailed, or turning the key on later
  // would silently skip every brief generated before it.
  if (result.status === "skipped") return false;

  await prisma.dailyBrief.update({ where: { id: brief.id }, data: { emailSent: true } });
  return true;
}
