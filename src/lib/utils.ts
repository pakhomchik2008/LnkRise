import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Calendar day at UTC midnight — the canonical key for briefs and snapshots. */
export function toUtcDay(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function initials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0] ?? "?").slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

/**
 * LinkedIn profile URL validation.
 * Accepts the /in/ vanity form with or without protocol/subdomain/trailing slash.
 */
const LINKEDIN_PROFILE_RE =
  /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%À-ÿ]{3,100})\/?(?:\?.*)?$/i;

export function parseLinkedInUrl(input: string): { valid: boolean; slug?: string; normalized?: string } {
  const trimmed = input.trim();
  const match = LINKEDIN_PROFILE_RE.exec(trimmed);
  if (!match || !match[1]) return { valid: false };
  const slug = match[1];
  return { valid: true, slug, normalized: `https://www.linkedin.com/in/${slug}` };
}

export function pluralize(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/** Deterministic 0..1 pseudo-random from a string seed — keeps mock data stable. */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
