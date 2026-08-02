import "server-only";

import { prisma } from "@/lib/prisma";
import { toJson } from "@/lib/prisma";
import { toUtcDay } from "@/lib/utils";
import {
  communityApiEnabled,
  fetchMemberAnalytics,
  LinkedInApiError,
  type MemberMetric,
  type MetricPoint,
} from "./client";
import { getLinkedInConnection, hasScope } from "./tokens";

/**
 * Pulls what the official API actually exposes and writes it into the same
 * AnalyticsSnapshot rows the manual form and the extension write to, tagged
 * with source "api".
 *
 * What it can and cannot fill:
 *   postImpressions  <- IMPRESSION, per day. Direct.
 *   profileViews     <- PROFILE_VIEW_FROM_CONTENT. This is views *driven by
 *                       your posts*, not total profile views — a subset. It is
 *                       recorded as-is rather than presented as the total.
 *   followers        <- FOLLOWER_GAINED_FROM_CONTENT is a delta, not a count.
 *                       There is no member follower-count endpoint, so this
 *                       stays 0 unless another source filled it.
 *   connections      <- no endpoint at all. Untouched by this sync.
 *
 * Which is the honest reason the manual form and the extension both still
 * exist: the official API is the cleanest source but not a complete one.
 */

export const SYNCED_METRICS: MemberMetric[] = [
  "IMPRESSION",
  "MEMBERS_REACHED",
  "REACTION",
  "COMMENT",
  "PROFILE_VIEW_FROM_CONTENT",
  "FOLLOWER_GAINED_FROM_CONTENT",
];

export type SyncOutcome =
  | { ok: true; daysWritten: number; partial: boolean }
  | { ok: false; reason: "disabled" | "disconnected" | "expired" | "missing_scope" | "failed"; message: string };

function groupByDay(points: MetricPoint[]): Map<string, Partial<Record<MemberMetric, number>>> {
  const byDay = new Map<string, Partial<Record<MemberMetric, number>>>();

  for (const point of points) {
    if (!point.date) continue; // lifetime totals have no day to attach to
    const bucket = byDay.get(point.date) ?? {};
    bucket[point.metric] = (bucket[point.metric] ?? 0) + point.count;
    byDay.set(point.date, bucket);
  }

  return byDay;
}

export async function syncMemberAnalytics(userId: string, days = 14): Promise<SyncOutcome> {
  if (!communityApiEnabled()) {
    return {
      ok: false,
      reason: "disabled",
      message: "The official API is not enabled on this deployment.",
    };
  }

  const connection = await getLinkedInConnection(userId);

  if (connection.status === "disconnected") {
    return { ok: false, reason: "disconnected", message: "No linked account." };
  }
  if (connection.status === "expired" || !connection.accessToken) {
    return { ok: false, reason: "expired", message: "The connection expired — reconnect to resume syncing." };
  }
  if (!hasScope(connection, "r_member_postAnalytics")) {
    return {
      ok: false,
      reason: "missing_scope",
      message: "This account was connected before analytics access was granted. Reconnect to add it.",
    };
  }

  const end = toUtcDay();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  let points: MetricPoint[];
  try {
    points = await fetchMemberAnalytics(connection.accessToken, SYNCED_METRICS, start, end);
  } catch (error) {
    if (error instanceof LinkedInApiError && error.needsReauth) {
      return { ok: false, reason: "expired", message: "The connection was rejected — reconnect." };
    }
    console.error("[linkedin] analytics sync failed", error);
    return { ok: false, reason: "failed", message: "The platform did not return analytics." };
  }

  const byDay = groupByDay(points);
  if (byDay.size === 0) {
    return { ok: true, daysWritten: 0, partial: true };
  }

  for (const [day, metrics] of byDay) {
    const date = toUtcDay(new Date(`${day}T00:00:00Z`));
    const impressions = metrics.IMPRESSION ?? 0;
    const reached = metrics.MEMBERS_REACHED ?? 0;
    const engagements = (metrics.REACTION ?? 0) + (metrics.COMMENT ?? 0);

    await prisma.analyticsSnapshot.upsert({
      where: { userId_date: { userId, date } },
      update: {
        postImpressions: impressions,
        profileViews: metrics.PROFILE_VIEW_FROM_CONTENT ?? 0,
        engagementRate: impressions > 0 ? Number((engagements / impressions).toFixed(4)) : 0,
        source: "api",
        rawData: toJson(metrics),
      },
      create: {
        userId,
        date,
        postImpressions: impressions,
        profileViews: metrics.PROFILE_VIEW_FROM_CONTENT ?? 0,
        engagementRate: impressions > 0 ? Number((engagements / impressions).toFixed(4)) : 0,
        source: "api",
        rawData: toJson({ ...metrics, membersReached: reached }),
      },
    });
  }

  // "Partial" is the normal case, not an error: connections and total follower
  // count have no endpoint, so those columns are never filled from here.
  return { ok: true, daysWritten: byDay.size, partial: true };
}
