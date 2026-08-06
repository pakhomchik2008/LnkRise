import type { CommentSuggestion, OnboardingAnswers, Strategy } from "@/types";
import { seededRandom } from "@/lib/utils";
import { GOAL_PROFILES } from "./mock/banks";
import { templateVars } from "./mock/vars";
import { commentSuggestionsPrompt, commentSuggestionsSystem } from "./prompts";
import { generateJson, withFallback } from "./provider";
import { commentSuggestionsJsonSchema, commentSuggestionsSchema } from "./schemas";
import type { AiResult } from "./index";

/**
 * Conversations worth joining today.
 *
 * The daily brief already carries three of these. This module exists for the
 * case the brief cannot serve: the user has worked through today's three and
 * wants more, without regenerating (and thereby replacing) the whole brief
 * along with the post draft they may have already started editing.
 */

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

function pickMany<T>(items: readonly T[], count: number, random: () => number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    const [taken] = pool.splice(Math.floor(random() * pool.length), 1);
    if (taken !== undefined) out.push(taken);
  }
  return out;
}

export function mockCommentSuggestions(
  seed: string,
  answers: OnboardingAnswers,
  count: number,
): CommentSuggestion[] {
  const random = seededRandom(seed);
  const goal = GOAL_PROFILES[answers.goal];
  const vars = templateVars(answers.industry);

  return pickMany(goal.commentAngles, Math.min(count, goal.commentAngles.length), random).map(
    (item) => ({
      topic: fill(item.topic, vars),
      why: fill(item.why, vars),
      starters: item.starters.map((starter) => fill(starter, vars)),
      timeEstimate: `~${3 + Math.floor(random() * 3)} minutes`,
    }),
  );
}

export async function generateCommentSuggestions(
  seed: string,
  answers: OnboardingAnswers,
  strategy: Strategy,
  options: { count?: number; exclude?: string[] } = {},
): Promise<AiResult<CommentSuggestion[]>> {
  const count = options.count ?? 3;
  const exclude = options.exclude ?? [];

  return withFallback(
    async () => {
      const parsed = await generateJson({
        system: commentSuggestionsSystem,
        prompt: commentSuggestionsPrompt(answers, strategy, count, exclude),
        jsonSchema: commentSuggestionsJsonSchema,
        validator: commentSuggestionsSchema,
        effort: "low",
      });
      return parsed.suggestions;
    },
    () => mockCommentSuggestions(`${seed}:more:${exclude.length}`, answers, count),
  );
}

/**
 * Named-people attachment lives in lib/briefs.ts, which is deliberately free
 * of these provider imports so it stays pure. Re-exported here so callers
 * working with comment suggestions do not have to know that.
 */
export { attachRealPeopleToComments } from "@/lib/briefs";
