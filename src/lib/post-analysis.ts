import type { PostAnalysis, PostVerdict } from "@/types";

/**
 * Deterministic read on a draft: length, the "see more" fold, and whether the
 * opening and the ending do their job.
 *
 * Every number here is a rule of thumb, not a measurement, and the UI says so.
 * We have no engagement data to fit these against — claiming "posts like this
 * get 3x more engagement" would be inventing a statistic. What this can do
 * honestly is check structure: is there a hook, is there an ask, does the
 * first paragraph survive the fold.
 *
 * No AI call. It runs on every keystroke, and a model round-trip per
 * character would be both slow and pointless for counting.
 */

/**
 * Characters before the feed collapses a post behind "…see more".
 *
 * Approximate and set by LinkedIn, who change it without notice; it also
 * depends on line breaks, not just character count. Treated as a guide rather
 * than a guarantee — the preview marks the fold, it does not promise it.
 */
export const FOLD = { desktop: 210, mobile: 140 } as const;

/** Platform hard limit on a post body. */
export const MAX_LENGTH = 3000;

const WORDS_PER_MINUTE = 220;

/**
 * An ask directed at the reader.
 *
 * These are deliberately narrow. A bare `\b(share|comment|follow)\b` matches
 * "excited to share that I joined" — an announcement with no ask in it — and
 * scored posts as having a CTA when they had nothing of the kind. The verb has
 * to be pointed at the reader, so each pattern carries its own context.
 */
const CTA_PATTERNS = [
  /\?\s*$/, // ends on a question
  /\bwhat (do|would|are|has) you\b/i,
  /\bhow (do|would) you\b/i,
  /\b(let me know|tell me|curious to hear|your thoughts|thoughts\?|agree\?|disagree\?)\b/i,
  /\b(leave a comment|drop a comment|comment below|comment if)\b/i,
  /\b(share (this|your|it)|repost|follow me|follow for|subscribe)\b/i,
  /\b(dm me|message me|reach out|get in touch|my inbox is open)\b/i,
  /\bif you(?:'re| are)\b[^.!?]*\b(hiring|looking|interested|building|stuck)\b/i,
];

const WEAK_OPENERS = [
  /^(hi|hello|hey)\b/i,
  /^(i(?:'m| am) (excited|thrilled|happy|pleased|delighted))/i,
  /^(today|recently|last week|yesterday),? i\b/i,
  /^(as (a|an) )/i,
  /^(in (today|this) (world|article|post))/i,
];

function firstLines(text: string, count: number): string {
  return text.split("\n").filter(Boolean).slice(0, count).join(" ");
}

/**
 * Hook quality, 0-10, from the opening two lines.
 *
 * Structural signals only — length, whether it opens on a cliché, whether it
 * makes a concrete or arguable statement. It cannot judge whether the claim is
 * *interesting*, and the copy around it does not pretend it can.
 */
function scoreHook(text: string): { score: number; note: string } {
  const opening = firstLines(text, 2).trim();

  if (opening.length === 0) return { score: 0, note: "Nothing to judge yet." };

  let score = 5;
  const reasons: string[] = [];

  if (WEAK_OPENERS.some((pattern) => pattern.test(opening))) {
    score -= 3;
    reasons.push("it opens on a stock phrase readers scroll past");
  }

  if (opening.length < 40) {
    score -= 1;
    reasons.push("it is short enough that it may not say anything yet");
  } else if (opening.length > 220) {
    score -= 2;
    reasons.push("it runs past the fold before making its point");
  } else {
    score += 1;
  }

  if (/\d/.test(opening)) {
    score += 1;
    reasons.push("the number gives it something concrete to hold");
  }

  if (opening.includes("?")) {
    score += 1;
    reasons.push("the question invites an answer");
  }

  // A flat statement of fact rarely stops a scroll; a claim someone could
  // argue with does.
  if (/\b(most|nobody|everyone|never|always|wrong|myth|stop|worst|hardest)\b/i.test(opening)) {
    score += 2;
    reasons.push("it stakes out a position worth disagreeing with");
  }

  const bounded = Math.max(0, Math.min(10, score));
  const note =
    reasons.length > 0
      ? `${reasons[0]!.charAt(0).toUpperCase()}${reasons[0]!.slice(1)}.`
      : "Serviceable, but nothing in it demands attention.";

  return { score: bounded, note };
}

function lengthVerdict(length: number): { verdict: PostVerdict; note: string } {
  if (length === 0) return { verdict: "empty", note: "Nothing written yet." };
  if (length < 300) {
    return {
      verdict: "short",
      note: "Short posts work when the single idea is sharp. If it is not, this reads as a thought you did not finish.",
    };
  }
  if (length <= 1300) {
    return {
      verdict: "good",
      note: "Comfortable length — long enough to make a case, short enough to finish.",
    };
  }
  if (length <= MAX_LENGTH) {
    return {
      verdict: "long",
      note: "Long. Worth cutting unless every paragraph earns its place.",
    };
  }
  return {
    verdict: "over_limit",
    note: `Over the ${MAX_LENGTH.toLocaleString("en-US")} character limit — this will be rejected.`,
  };
}

export function analyzePost(text: string): PostAnalysis {
  const trimmed = text.trim();
  const characters = trimmed.length;
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;

  const hook = scoreHook(trimmed);
  const length = lengthVerdict(characters);
  const hasCta = CTA_PATTERNS.some((pattern) => pattern.test(trimmed));

  return {
    characters,
    words,
    readSeconds: Math.max(1, Math.round((words / WORDS_PER_MINUTE) * 60)),
    hookScore: hook.score,
    hookNote: hook.note,
    hasCta,
    ctaNote: hasCta
      ? "There is an ask at the end. That is what turns a read into a comment."
      : "No ask anywhere. Readers who agree with you will scroll on unless you give them something to reply to.",
    verdict: length.verdict,
    lengthNote: length.note,
    aboveFold: {
      desktop: trimmed.slice(0, FOLD.desktop),
      mobile: trimmed.slice(0, FOLD.mobile),
    },
    foldedDesktop: characters > FOLD.desktop,
    foldedMobile: characters > FOLD.mobile,
  };
}

/**
 * LinkedIn renders post bodies as plain text — no bold, italic or headings.
 * The workaround people actually use is Unicode's mathematical alphanumeric
 * block, which survives because it is characters rather than markup.
 *
 * It has a real cost: screen readers announce these as individual symbols or
 * skip them, and they are not searchable. The UI warns before applying it.
 */
const MATH_BOLD_UPPER = 0x1d5d4;
const MATH_BOLD_LOWER = 0x1d5ee;
const MATH_BOLD_DIGIT = 0x1d7ec;

export function toUnicodeBold(text: string): string {
  return [...text]
    .map((char) => {
      const code = char.codePointAt(0);
      if (code === undefined) return char;
      if (code >= 0x41 && code <= 0x5a) return String.fromCodePoint(MATH_BOLD_UPPER + (code - 0x41));
      if (code >= 0x61 && code <= 0x7a) return String.fromCodePoint(MATH_BOLD_LOWER + (code - 0x61));
      if (code >= 0x30 && code <= 0x39) return String.fromCodePoint(MATH_BOLD_DIGIT + (code - 0x30));
      return char;
    })
    .join("");
}
