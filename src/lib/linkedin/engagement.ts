import "server-only";

/**
 * Client for LinkedIn's Comments API and Reactions API — reading who engaged
 * with the member's own posts.
 *
 * DORMANT. Requires the same Community Management API approval as the rest
 * of this directory, and additionally has an unresolved gap even once
 * approved: the API returns an `actor` field as a bare
 * `urn:li:person:XXXXXXXXXX` for the commenter/reactor. There is no
 * documented endpoint in the Community Management API standard tier to
 * resolve another member's URN into a display name or public profile URL —
 * that lookup is gated behind partner-level access this app does not have.
 * A 2018 report (github.com/MicrosoftDocs/feedback/issues/971) shows the
 * `actor` field has historically been unreliable to begin with.
 *
 * Because of that gap, this client intentionally returns only what the API
 * actually gives us — a URN and, for comments, the comment text — and does
 * NOT attempt to synthesize a name. Do not add a name field here without a
 * confirmed resolution path; guessing one would misattribute a comment to
 * the wrong person.
 *
 * Wiring this into the daily brief UI is deferred: "reply to someone who
 * commented on you" is a different action shape than "connect" (no search
 * query, no cold opener — you go to the post you already have and reply
 * there), and forcing it into the existing connect/comment card types would
 * recreate the exact card-doesn't-match-the-action confusion that prompted
 * the brief-cards rewrite. Needs its own card once this is reachable.
 *
 * Docs: learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/comments-api
 *       learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/reactions-api
 */

import { communityApiEnabled, LinkedInApiError } from "./client";

const API = "https://api.linkedin.com/rest";
const LINKEDIN_VERSION = process.env.LINKEDIN_API_VERSION ?? "202606";

function headers(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": LINKEDIN_VERSION,
  };
}

async function call<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { headers: headers(accessToken), cache: "no-store" });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new LinkedInApiError(`LinkedIn GET ${path} failed: ${response.status}`, response.status, body);
  }

  return (await response.json()) as T;
}

export { communityApiEnabled };

export interface EngagementActor {
  /** urn:li:person:XXXXXXXXXX — not a name. See the file header for why. */
  actorUrn: string;
}

export interface RecentComment extends EngagementActor {
  text: string;
  commentUrn: string;
}

export interface RecentReaction extends EngagementActor {
  reactionType: string;
}

interface RawComment {
  actor: string;
  message?: { text?: string };
  $URN?: string;
}

interface RawReaction {
  actor: string;
  reactionType?: string;
}

/**
 * Comments on one of the member's own posts, most recent first.
 * `postUrn` must be a share/ugcPost URN from a Post this app itself
 * published (Post.linkedinUrn) — there is no way to look up comments on a
 * post that was only copy-pasted manually, since we never learn its URN.
 */
export async function fetchRecentComments(
  accessToken: string,
  postUrn: string,
  limit = 10,
): Promise<RecentComment[]> {
  const encoded = encodeURIComponent(postUrn);
  const data = await call<{ elements: RawComment[] }>(
    `/socialActions/${encoded}/comments?count=${limit}`,
    accessToken,
  );

  return (data.elements ?? [])
    .filter((comment) => Boolean(comment.message?.text))
    .map((comment) => ({
      actorUrn: comment.actor,
      text: comment.message!.text!,
      commentUrn: comment.$URN ?? "",
    }));
}

/**
 * Reactions on one of the member's own posts. Same URN caveat as comments.
 */
export async function fetchRecentReactions(
  accessToken: string,
  postUrn: string,
  limit = 10,
): Promise<RecentReaction[]> {
  const encoded = encodeURIComponent(postUrn);
  const data = await call<{ elements: RawReaction[] }>(
    `/socialActions/${encoded}/reactions?count=${limit}`,
    accessToken,
  );

  return (data.elements ?? []).map((reaction) => ({
    actorUrn: reaction.actor,
    reactionType: reaction.reactionType ?? "LIKE",
  }));
}
