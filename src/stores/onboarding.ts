import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingAnswers } from "@/types";

interface OnboardingState {
  draft: Partial<OnboardingAnswers>;
  stepIndex: number;
  setAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  setFollowUp: (key: string, value: string) => void;
  next: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      draft: { inspirations: [], followUps: {} },
      stepIndex: 0,
      setAnswer: (key, value) =>
        set((state) => ({ draft: { ...state.draft, [key]: value } })),
      setFollowUp: (key, value) =>
        set((state) => ({
          draft: { ...state.draft, followUps: { ...state.draft.followUps, [key]: value } },
        })),
      next: () => set((state) => ({ stepIndex: state.stepIndex + 1 })),
      reset: () => set({ draft: { inspirations: [], followUps: {} }, stepIndex: 0 }),
    }),
    {
      name: "lnkrise-onboarding",
      // Survives a refresh mid-questionnaire; cleared once the plan is built.
      partialize: (state) => ({ draft: state.draft, stepIndex: state.stepIndex }),
    },
  ),
);
