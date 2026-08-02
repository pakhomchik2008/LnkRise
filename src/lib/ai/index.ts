import type {
  DailyBriefContent,
  LinkedInProfile,
  OnboardingAnswers,
  ProfileAnalysis,
  Strategy,
} from "@/types";
import { mockDailyBrief, mockProfileAnalysis, mockStrategy } from "./mock/engine";
import {
  dailyBriefPrompt,
  dailyBriefSystem,
  profileAnalysisPrompt,
  profileAnalysisSystem,
  strategyPrompt,
  strategySystem,
} from "./prompts";
import { generateJson, hasAnthropicKey, withFallback } from "./provider";
import {
  dailyBriefJsonSchema,
  dailyBriefSchema,
  profileAnalysisJsonSchema,
  profileAnalysisSchema,
  strategyJsonSchema,
  strategySchema,
} from "./schemas";

export interface AiResult<T> {
  value: T;
  source: "ai" | "mock";
}

export { hasAnthropicKey };

export async function analyzeProfile(
  seed: string,
  answers: OnboardingAnswers,
  profile?: LinkedInProfile | null,
): Promise<AiResult<ProfileAnalysis>> {
  const generatedAt = new Date().toISOString();

  return withFallback(
    async () => {
      const parsed = await generateJson({
        system: profileAnalysisSystem,
        prompt: profileAnalysisPrompt(answers, profile),
        jsonSchema: profileAnalysisJsonSchema,
        validator: profileAnalysisSchema,
        effort: "medium",
      });
      return { ...parsed, generatedAt } satisfies ProfileAnalysis;
    },
    () => mockProfileAnalysis({ seed, answers, profile }),
  );
}

export async function generateStrategy(
  seed: string,
  answers: OnboardingAnswers,
  analysis: ProfileAnalysis,
): Promise<AiResult<Strategy>> {
  const generatedAt = new Date().toISOString();

  return withFallback(
    async () => {
      const parsed = await generateJson({
        system: strategySystem,
        prompt: strategyPrompt(answers, analysis),
        jsonSchema: strategyJsonSchema,
        validator: strategySchema,
        effort: "medium",
      });
      return { ...parsed, generatedAt } satisfies Strategy;
    },
    () => mockStrategy({ seed, answers }),
  );
}

export async function generateDailyBrief(
  seed: string,
  answers: OnboardingAnswers,
  strategy: Strategy,
  dayNumber: number,
  recentTopics: string[] = [],
): Promise<AiResult<DailyBriefContent>> {
  return withFallback(
    () =>
      generateJson({
        system: dailyBriefSystem,
        prompt: dailyBriefPrompt(answers, strategy, dayNumber, recentTopics),
        jsonSchema: dailyBriefJsonSchema,
        validator: dailyBriefSchema,
        maxTokens: 6000,
        effort: "medium",
      }),
    () => mockDailyBrief({ seed, answers }),
  );
}
