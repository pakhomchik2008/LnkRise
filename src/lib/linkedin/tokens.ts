import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * LinkedIn access tokens live ~60 days. Refresh tokens are only issued to
 * approved partner apps, so for everyone else expiry means "ask the user to
 * reconnect" rather than a silent refresh. That is surfaced as a status the UI
 * can act on instead of an exception.
 */

export type ConnectionStatus = "connected" | "expiring" | "expired" | "disconnected";

export interface LinkedInConnection {
  status: ConnectionStatus;
  accessToken: string | null;
  /** urn:li:person:{id} — required as the author on any publish call. */
  personUrn: string | null;
  expiresAt: Date | null;
  scopes: string[];
}

const EXPIRING_SOON_MS = 7 * 24 * 60 * 60 * 1000;

export async function getLinkedInConnection(userId: string): Promise<LinkedInConnection> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "linkedin" },
    select: {
      access_token: true,
      expires_at: true,
      scope: true,
      providerAccountId: true,
    },
  });

  if (!account?.access_token) {
    return { status: "disconnected", accessToken: null, personUrn: null, expiresAt: null, scopes: [] };
  }

  const expiresAt = account.expires_at ? new Date(account.expires_at * 1000) : null;
  const scopes = account.scope?.split(/[\s,]+/).filter(Boolean) ?? [];

  let status: ConnectionStatus = "connected";
  if (expiresAt) {
    const remaining = expiresAt.getTime() - Date.now();
    if (remaining <= 0) status = "expired";
    else if (remaining < EXPIRING_SOON_MS) status = "expiring";
  }

  return {
    status,
    accessToken: status === "expired" ? null : account.access_token,
    personUrn: `urn:li:person:${account.providerAccountId}`,
    expiresAt,
    scopes,
  };
}

export function hasScope(connection: LinkedInConnection, scope: string): boolean {
  return connection.scopes.includes(scope);
}
