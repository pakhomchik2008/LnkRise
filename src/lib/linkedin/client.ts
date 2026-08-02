import "server-only";

/**
 * Client for the official Community Management API.
 *
 * UNVERIFIED AGAINST A LIVE ACCOUNT. `r_member_postAnalytics` and
 * `w_member_social` both require LinkedIn to approve the app first, which had
 * not happened when this was written. The request shapes follow the published
 * documentation; treat the first real call as the actual test, and expect to
 * adjust the response parsing rather than the request construction.
 *
 * Docs: learn.microsoft.com/en-us/linkedin/marketing/community-management/members/post-statistics
 */

const API = "https://api.linkedin.com/rest";

/** Versioned APIs require an explicit YYYYMM version on every request. */
const LINKEDIN_VERSION = process.env.LINKEDIN_API_VERSION ?? "202606";

export function communityApiEnabled(): boolean {
  return process.env.LINKEDIN_COMMUNITY_API === "enabled";
}

export class LinkedInApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "LinkedInApiError";
  }

  /** The token expired or was revoked — the user has to reconnect. */
  get needsReauth(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

function headers(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": LINKEDIN_VERSION,
    "Content-Type": "application/json",
  };
}

async function call<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...headers(accessToken), ...(init?.headers ?? {}) },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new LinkedInApiError(
      `LinkedIn ${init?.method ?? "GET"} ${path} failed: ${response.status}`,
      response.status,
      body,
    );
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export type MemberMetric =
  | "IMPRESSION"
  | "MEMBERS_REACHED"
  | "REACTION"
  | "COMMENT"
  | "RESHARE"
  | "POST_SAVE"
  | "POST_SEND"
  | "LINK_CLICKS"
  | "FOLLOWER_GAINED_FROM_CONTENT"
  | "PROFILE_VIEW_FROM_CONTENT";

/** DAILY is rejected for these — the API only returns a lifetime total. */
const TOTAL_ONLY: ReadonlySet<MemberMetric> = new Set([
  "MEMBERS_REACHED",
  "LINK_CLICKS",
  "FOLLOWER_GAINED_FROM_CONTENT",
  "PROFILE_VIEW_FROM_CONTENT",
]);

export interface MetricPoint {
  metric: MemberMetric;
  count: number;
  /** Absent when the aggregation was TOTAL. */
  date?: string;
}

interface RawElement {
  count: number;
  // Plain string from version 2026-05 onward; a namespaced object before that.
  metricType: string | Record<string, string>;
  dateRange?: {
    start?: { year: number; month: number; day: number };
    end?: { year: number; month: number; day: number };
  };
}

function readMetricType(value: RawElement["metricType"]): string {
  return typeof value === "string" ? value : (Object.values(value)[0] ?? "");
}

function isoDate(part?: { year: number; month: number; day: number }): string | undefined {
  if (!part) return undefined;
  const month = String(part.month).padStart(2, "0");
  const day = String(part.day).padStart(2, "0");
  return `${part.year}-${month}-${day}`;
}

function dateRangeParam(start: Date, end: Date): string {
  const format = (date: Date) =>
    `(day:${date.getUTCDate()},month:${date.getUTCMonth() + 1},year:${date.getUTCFullYear()})`;
  return `dateRange=(start:${format(start)},end:${format(end)})`;
}

/**
 * Aggregated analytics across all of the member's own posts.
 * One request per metric — the API takes a single `queryType`.
 */
export async function fetchMemberAnalytics(
  accessToken: string,
  metrics: MemberMetric[],
  start: Date,
  end: Date,
): Promise<MetricPoint[]> {
  const points: MetricPoint[] = [];

  for (const metric of metrics) {
    const aggregation = TOTAL_ONLY.has(metric) ? "TOTAL" : "DAILY";
    const query = `?q=me&queryType=${metric}&aggregation=${aggregation}&${dateRangeParam(start, end)}`;

    try {
      const data = await call<{ elements: RawElement[] }>(
        `/memberCreatorPostAnalytics${query}`,
        accessToken,
      );

      for (const element of data.elements ?? []) {
        points.push({
          metric: (readMetricType(element.metricType) || metric) as MemberMetric,
          count: element.count,
          date: isoDate(element.dateRange?.start),
        });
      }
    } catch (error) {
      // One unsupported metric must not lose the rest of the pull.
      if (error instanceof LinkedInApiError && error.needsReauth) throw error;
      console.warn(`[linkedin] metric ${metric} failed`, error);
    }
  }

  return points;
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

export interface PublishResult {
  urn: string;
}

/**
 * Publishes to the member's own feed. Only ever called from an action the user
 * explicitly confirmed — there is no scheduled or automatic posting path.
 */
export async function publishPost(
  accessToken: string,
  personUrn: string,
  commentary: string,
): Promise<PublishResult> {
  const response = await fetch(`${API}/posts`, {
    method: "POST",
    headers: headers(accessToken),
    cache: "no-store",
    body: JSON.stringify({
      author: personUrn,
      commentary,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new LinkedInApiError(`Publish failed: ${response.status}`, response.status, body);
  }

  // The created post's URN comes back in a header, not the body.
  const urn = response.headers.get("x-restli-id");
  if (!urn) throw new LinkedInApiError("Published, but no URN was returned", 200);

  return { urn };
}
