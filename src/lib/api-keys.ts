import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";

/**
 * Ingest keys for the browser extension.
 *
 * The raw key is returned exactly once, at creation. Only its SHA-256 hash is
 * stored, so a database leak yields nothing usable. SHA-256 rather than a slow
 * KDF is the right call here: the key is 32 bytes of CSPRNG output, not a
 * human-chosen password, so there is no dictionary to attack — and the ingest
 * endpoint is on a hot path.
 */

const PREFIX = "lnk_";
const KEY_BYTES = 32;

export interface CreatedApiKey {
  id: string;
  /** Shown once. Never recoverable. */
  raw: string;
  prefix: string;
}

function hash(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createApiKey(userId: string, label = "Browser extension"): Promise<CreatedApiKey> {
  const raw = `${PREFIX}${randomBytes(KEY_BYTES).toString("base64url")}`;
  const prefix = raw.slice(0, 12);

  const record = await prisma.apiKey.create({
    data: { userId, label, prefix, hashedKey: hash(raw) },
    select: { id: true },
  });

  return { id: record.id, raw, prefix };
}

export async function revokeApiKey(userId: string, keyId: string): Promise<boolean> {
  const result = await prisma.apiKey.updateMany({
    where: { id: keyId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

/**
 * Resolves a raw key to a user id, or null. Constant-time comparison on the
 * hash so a timing side channel cannot be used to recover a key byte by byte.
 *
 * Returns the previous `lastUsedAt` alongside the userId so callers can
 * throttle without an in-process map (which is useless on multi-instance
 * hosts like Vercel). Persist storage on the row is the shared clock.
 */
export async function resolveApiKey(
  raw: string | null | undefined,
): Promise<{ userId: string; lastUsedAt: Date | null } | null> {
  if (!raw || !raw.startsWith(PREFIX) || raw.length > 200) return null;

  const candidate = hash(raw);

  const record = await prisma.apiKey.findUnique({
    where: { hashedKey: candidate },
    select: { id: true, userId: true, hashedKey: true, revokedAt: true, lastUsedAt: true },
  });

  if (!record || record.revokedAt) return null;

  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(record.hashedKey, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  await prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return { userId: record.userId, lastUsedAt: record.lastUsedAt };
}

export function bearerFrom(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}
