/**
 * Best-effort display name for a profile the user named during onboarding.
 *
 * No API call, no approval needed — this only reads the URL the user already
 * gave us. It is not their real name, only a guess derived from the URL
 * slug, and it is presented as such rather than asserted as fact: LinkedIn
 * vanity slugs are usually "first-last" but can also be a random handle
 * ("john-smith-4a2b19c" or "jsmith8842"), in which case the guess degrades to
 * null rather than showing something wrong with false confidence.
 */

export interface NamedInspiration {
  name: string;
  url: string;
}

const TRAILING_ID_SUFFIX = /-[0-9a-f]{4,}$|-\d{2,}$/i;

function looksLikeAName(slug: string): boolean {
  // A real name slug is mostly letters split by hyphens, 2+ words, no long
  // runs of digits/hex — "jane-doe" passes, "jsmith8842" or "a1b2c3d4" don't.
  const words = slug.split("-").filter(Boolean);
  if (words.length < 2) return false;
  return words.every((word) => /^[a-z]+$/i.test(word) && word.length >= 2);
}

function deriveName(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/\/in\/([^/]+)/);
    const slugParam = match?.[1];
    if (!slugParam) return null;

    let slug = decodeURIComponent(slugParam).toLowerCase();
    slug = slug.replace(TRAILING_ID_SUFFIX, "");

    if (!looksLikeAName(slug)) return null;

    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } catch {
    return null;
  }
}

export function labelInspirations(urls: string[]): NamedInspiration[] {
  const seen = new Set<string>();
  const result: NamedInspiration[] = [];

  for (const url of urls) {
    const name = deriveName(url);
    if (!name || seen.has(url)) continue;
    seen.add(url);
    result.push({ name, url });
  }

  return result;
}
