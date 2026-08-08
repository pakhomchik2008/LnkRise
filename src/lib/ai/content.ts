import type {
  OnboardingAnswers,
  PostConcept,
  PostOutline,
  RewriteMode,
  Strategy,
  UserFact,
} from "@/types";
import { mockConcepts, mockDraft, mockOutline, mockRewrite } from "./mock/content";
import {
  postConceptsPrompt,
  postConceptsSystem,
  postDraftPrompt,
  postDraftSystem,
  postOutlinePrompt,
  postOutlineSystem,
  rewritePrompt,
  rewriteSystem,
} from "./prompts";
import { generateJson, withFallback } from "./provider";
import {
  postConceptsJsonSchema,
  postConceptsSchema,
  postDraftJsonSchema,
  postDraftSchema,
  postOutlineJsonSchema,
  postOutlineSchema,
  rewriteJsonSchema,
  rewriteSchema,
} from "./schemas";
import type { AiResult } from "./index";

/**
 * The writing flow: concepts, then an outline the user approves, then a draft.
 *
 * Split into three steps rather than one "write me a post" call because the
 * user gets to redirect it twice — the outline in particular is where a wrong
 * angle is cheap to fix, and it is much easier to edit four bullet points than
 * to explain what is wrong with 1200 finished characters.
 */

export async function generateConcepts(
  seed: string,
  answers: OnboardingAnswers,
  strategy: Strategy,
  recentTopics: string[] = [],
  count = 4,
  facts: UserFact[] = [],
): Promise<AiResult<PostConcept[]>> {
  return withFallback(
    async () => {
      const parsed = await generateJson({
        system: postConceptsSystem,
        prompt: postConceptsPrompt(answers, strategy, recentTopics, facts),
        jsonSchema: postConceptsJsonSchema,
        validator: postConceptsSchema,
        effort: "medium",
      });
      return parsed.concepts;
    },
    () => mockConcepts(seed, answers, count),
  );
}

export async function generateOutline(
  seed: string,
  answers: OnboardingAnswers,
  concept: { topic: string; angle: string },
  facts: UserFact[] = [],
): Promise<AiResult<PostOutline>> {
  return withFallback(
    () =>
      generateJson({
        system: postOutlineSystem,
        prompt: postOutlinePrompt(answers, concept, facts),
        jsonSchema: postOutlineJsonSchema,
        validator: postOutlineSchema,
        effort: "low",
      }),
    () => mockOutline(seed, answers, concept.topic),
  );
}

export async function generateDraft(
  answers: OnboardingAnswers,
  outline: PostOutline,
  facts: UserFact[] = [],
): Promise<AiResult<string>> {
  return withFallback(
    async () => {
      const parsed = await generateJson({
        system: postDraftSystem,
        prompt: postDraftPrompt(answers, outline, facts),
        jsonSchema: postDraftJsonSchema,
        validator: postDraftSchema,
        maxTokens: 4000,
        effort: "medium",
      });
      return parsed.draft;
    },
    () => mockDraft(outline),
  );
}

export async function rewritePassage(
  passage: string,
  mode: RewriteMode,
  fullDraft: string,
): Promise<AiResult<string[]>> {
  return withFallback(
    async () => {
      const parsed = await generateJson({
        system: rewriteSystem,
        prompt: rewritePrompt(mode, passage, fullDraft),
        jsonSchema: rewriteJsonSchema,
        validator: rewriteSchema,
        effort: "low",
      });
      return parsed.alternatives;
    },
    () => mockRewrite(passage, mode),
  );
}
