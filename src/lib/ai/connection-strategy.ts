import type {
  ConnectionCategoryId,
  ConnectSuggestion,
  OnboardingAnswers,
  ConnectionPlan,
  Strategy,
} from "@/types";
import { seededRandom } from "@/lib/utils";
import { CONNECTION_CATEGORY_ORDER, mockConnectionPlan } from "./mock/connections";
import { connectionPlanPrompt, connectionPlanSystem } from "./prompts";
import { generateJson, withFallback } from "./provider";
import { connectionPlanJsonSchema, connectionPlanSchema } from "./schemas";
import type { AiResult } from "./index";

/**
 * Who the user should be reaching out to, grouped into four lanes.
 *
 * Categories are a fixed set rather than something the model invents, because
 * the Connections page tracks progress per lane — a generated category name
 * would break that mapping the moment it changed between runs.
 */

export async function generateConnectionPlan(
  answers: OnboardingAnswers,
  strategy: Strategy,
): Promise<AiResult<ConnectionPlan>> {
  const generatedAt = new Date().toISOString();

  return withFallback(
    async () => {
      const parsed = await generateJson({
        system: connectionPlanSystem,
        prompt: connectionPlanPrompt(answers, strategy),
        jsonSchema: connectionPlanJsonSchema,
        validator: connectionPlanSchema,
        effort: "medium",
      });

      // The schema pins the four ids but not their order or uniqueness — a
      // model can return four valid entries that are all "peers". Rebuilding
      // by the canonical order makes a duplicate impossible to store, and
      // falls back per-slot rather than discarding the whole response.
      const byId = new Map(parsed.categories.map((entry) => [entry.id, entry]));
      const fallback = mockConnectionPlan(answers);

      return {
        categories: CONNECTION_CATEGORY_ORDER.map(
          (id) =>
            byId.get(id) ??
            fallback.categories.find((entry) => entry.id === id)!,
        ),
        generatedAt,
      } satisfies ConnectionPlan;
    },
    () => mockConnectionPlan(answers),
  );
}

/**
 * Which lane a brief's outreach card belongs to.
 *
 * Briefs written before Phase 3 have no category on their ConnectSuggestions.
 * Rather than showing them as uncategorised, they are spread across the lanes
 * in the order the brief lists them — which is the order the generator has
 * always used, so the mapping is stable for a given brief even though it was
 * never stored.
 */
export function categoryOf(suggestion: ConnectSuggestion, index: number): ConnectionCategoryId {
  return (
    suggestion.category ??
    CONNECTION_CATEGORY_ORDER[index % CONNECTION_CATEGORY_ORDER.length] ??
    "peers"
  );
}

/**
 * Picks the lane today's brief should push, so the three outreach cards are
 * not the same three lanes every single day. Seeded by user and date: stable
 * within a day, different across days, no state to store.
 */
export function focusCategoryFor(seed: string, day: string): ConnectionCategoryId {
  const random = seededRandom(`${seed}:connect:${day}`);
  const index = Math.floor(random() * CONNECTION_CATEGORY_ORDER.length);
  return CONNECTION_CATEGORY_ORDER[index] ?? "peers";
}

export { CONNECTION_CATEGORY_ORDER, mockConnectionPlan };
