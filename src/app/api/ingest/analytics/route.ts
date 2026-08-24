import { NextResponse } from "next/server";
import { z } from "zod";
import { bearerFrom, resolveApiKey } from "@/lib/api-keys";
import { prisma } from "@/lib/prisma";
import { toJson } from "@/lib/prisma";
import { toUtcDay } from "@/lib/utils";

/**
 * Ingest endpoint for the browser extension.
 *
 * Authenticated by an ingest key, not a session cookie — so it must be
 * CORS-open to the extension's origin and must never accept cookie auth, or it
 * would become a CSRF hole. Every field is bounded; the payload is four
 * integers and nothing else.
 */

export const runtime = "nodejs";

// Every metric is optional: the numbers are split across two LinkedIn pages, so
// one read never carries all of them. Absent means "unknown", not zero — a
// partial update must leave the other columns alone.
const payloadSchema = z
  .object({
    profileViews: z.number().int().min(0).max(10_000_000).optional(),
    postImpressions: z.number().int().min(0).max(100_000_000).optional(),
    followers: z.number().int().min(0).max(100_000_000).optional(),
    connections: z.number().int().min(0).max(100_000).optional(),
    searchAppearances: z.number().int().min(0).max(10_000_000).optional(),
    /** yyyy-mm-dd. Defaults to today. Cannot be in the future. */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .refine((body) => Object.keys(body).some((field) => field !== "date"), {
    message: "At least one metric is required",
  });

// The shared clock is the `ApiKey.lastUsedAt` column — resolveApiKey returns
// what it was before this call, so any instance can decide "too soon" without
// coordinating in memory. Two subsequent posts from the same key must be at
// least MIN_INTERVAL_MS apart; anything faster is a bug or an abuse burst.
const MIN_INTERVAL_MS = 5_000;

function tooSoon(prev: Date | null): boolean {
  if (!prev) return false;
  return Date.now() - prev.getTime() < MIN_INTERVAL_MS;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  const resolved = await resolveApiKey(bearerFrom(request));
  if (!resolved) {
    return NextResponse.json({ error: "Invalid or revoked key" }, { status: 401, headers: CORS });
  }

  if (tooSoon(resolved.lastUsedAt)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: CORS });
  }

  const userId = resolved.userId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400, headers: CORS });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues.map((issue) => issue.path.join(".")) },
      { status: 400, headers: CORS },
    );
  }

  const { date, ...metrics } = parsed.data;
  const day = date ? toUtcDay(new Date(`${date}T00:00:00Z`)) : toUtcDay();

  if (day.getTime() > toUtcDay().getTime()) {
    return NextResponse.json({ error: "Date cannot be in the future" }, { status: 400, headers: CORS });
  }

  await prisma.analyticsSnapshot.upsert({
    where: { userId_date: { userId, date: day } },
    update: {
      ...metrics,
      source: "extension",
      rawData: toJson({ receivedAt: new Date().toISOString() }),
    },
    create: {
      userId,
      date: day,
      ...metrics,
      source: "extension",
      rawData: toJson({ receivedAt: new Date().toISOString() }),
    },
  });

  return NextResponse.json(
    { ok: true, date: day.toISOString().slice(0, 10) },
    { status: 200, headers: CORS },
  );
}
