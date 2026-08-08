"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Logo } from "@/components/shared/logo";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { completeOnboarding } from "@/app/onboarding/actions";
import {
  acknowledgement,
  factQuestionFor,
  visibleSteps,
  type OnboardingStep,
} from "@/lib/onboarding-flow";
import { useOnboardingStore } from "@/stores/onboarding";
import type { ChatMessage, ManualProfileDraft, OnboardingAnswers, ProfileAnalysis, Strategy } from "@/types";
import { cn, sleep } from "@/lib/utils";
import { Analyzing } from "./analyzing";
import { QuestionInput } from "./question-input";
import { Results } from "./results";

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Question ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, index) => (
        <motion.span
          key={index}
          animate={{
            width: index === current ? 22 : 6,
            opacity: index <= current ? 1 : 0.3,
          }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            "h-1.5 rounded-full",
            index < current
              ? "[background:var(--gradient-success)]"
              : index === current
                ? "[background:var(--gradient-primary)]"
                : "bg-ink/20",
          )}
        />
      ))}
    </div>
  );
}

function labelFor(step: OnboardingStep, value: string | string[] | ManualProfileDraft): string {
  if (step.kind === "profileForm") {
    const draft = value as ManualProfileDraft;
    return draft.headline || draft.about || draft.skills.length > 0 ? "Added my profile" : "Skipped";
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "Skipped" : `${value.length} profile${value.length > 1 ? "s" : ""}`;
  }
  if (!value) return "Skipped";
  const text = value as string;
  const option = step.options?.find((entry) => entry.value === text);
  return option?.label ?? text;
}

export function OnboardingChat() {
  const router = useRouter();
  const { draft, setAnswer, setFollowUp, reset } = useOnboardingStore();

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [thinking, setThinking] = React.useState(true);
  const [phase, setPhase] = React.useState<"chat" | "building" | "results">("chat");
  const [serverDone, setServerDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<{ analysis: ProfileAnalysis; strategy: Strategy } | null>(
    null,
  );

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const steps = React.useMemo(() => visibleSteps(draft), [draft]);
  const step = steps[stepIndex];

  // Ask the current question after a short "thinking" beat.
  React.useEffect(() => {
    if (phase !== "chat" || !step) return;

    let cancelled = false;
    setThinking(true);

    void (async () => {
      await sleep(650);
      if (cancelled) return;
      setThinking(false);
      setMessages((current) => [
        ...current,
        {
          id: `${step.id}-q`,
          role: "coach",
          text: step.dynamicQuestion ? step.dynamicQuestion(draft) : step.question,
        },
      ]);
    })();

    return () => {
      cancelled = true;
    };
    // draft is intentionally not a dependency — the question text is captured
    // when the step is asked, and re-running on every keystroke would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, phase, step?.id]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  async function handleAnswer(value: string | string[] | ManualProfileDraft) {
    if (!step) return;

    setMessages((current) => [
      ...current,
      { id: `${step.id}-a`, role: "user", text: labelFor(step, value) },
    ]);

    // Persist into the draft.
    switch (step.id) {
      case "transitionDetail":
        setFollowUp("transition", String(value));
        break;
      case "goalDetail":
        setFollowUp("goal", String(value));
        break;
      case "profile":
        setAnswer("profile", value as ManualProfileDraft);
        break;
      case "inspirations":
        setAnswer("inspirations", Array.isArray(value) ? value : []);
        break;
      case "timeBudget":
        setAnswer("timeBudget", Number(value) as 15 | 30 | 60);
        break;
      case "fact1":
      case "fact2":
      case "fact3": {
        // Stored with the question that produced it: the answer on its own
        // ("about six weeks, and we lost the contract") is unusable later
        // without knowing what was asked.
        const index = Number(step.id.slice(-1)) - 1;
        const asked = factQuestionFor(draft, index);
        const body = String(value).trim();
        if (asked && body.length > 0) {
          setAnswer("facts", [
            ...(draft.facts ?? []).filter((fact) => fact.question !== asked.question),
            { question: asked.question, body, kind: asked.kind },
          ] as never);
        }
        break;
      }
      default:
        setAnswer(step.id as keyof OnboardingAnswers, value as never);
    }

    const acknowledgementInput =
      step.kind === "profileForm"
        ? (value as ManualProfileDraft).headline ||
          (value as ManualProfileDraft).about ||
          (value as ManualProfileDraft).skills.length > 0
          ? "filled"
          : ""
        : Array.isArray(value)
          ? value.join(", ")
          : (value as string);
    const note = acknowledgement(step.id, acknowledgementInput);
    if (note) {
      await sleep(400);
      setMessages((current) => [...current, { id: `${step.id}-ack`, role: "coach", text: note }]);
    }

    const isLast = stepIndex === steps.length - 1;
    if (isLast) {
      await sleep(600);
      setPhase("building");
      // Only the timeBudget step is ever last, so this is always a plain string.
      void submit(typeof value === "string" ? value : undefined);
      return;
    }

    // Flip thinking here, in the same batch as the index bump, so the next
    // step's key never renders while thinking is still false. Without this,
    // React commits one frame with the new step's key and thinking=false
    // (the stepIndex-keyed effect that normally sets it hasn't run yet),
    // AnimatePresence starts entering that key, and the effect then yanks it
    // straight into exit before the enter finishes. Re-entering the same key
    // while its own exit is still in flight is exactly the case
    // AnimatePresence handles poorly — the node can get stuck holding its
    // exit style (opacity: 0) instead of ever reaching `animate`.
    setThinking(true);
    setStepIndex((index) => index + 1);
  }

  async function submit(lastValue?: string) {
    setError(null);
    setServerDone(false);

    const payload: Record<string, unknown> = {
      ...draft,
      inspirations: draft.inspirations ?? [],
      linkedinUrl: draft.linkedinUrl ?? "",
      timeBudget: lastValue !== undefined ? Number(lastValue) : (draft.timeBudget ?? 30),
    };

    const result = await completeOnboarding(payload);

    if (result.ok) {
      setResults({ analysis: result.analysis, strategy: result.strategy });
      setServerDone(true);
    } else {
      setError(result.error);
    }
  }

  if (phase === "results" && results) {
    return (
      <Results
        analysis={results.analysis}
        strategy={results.strategy}
        onContinue={() => {
          reset();
          router.push("/dashboard?welcome=1");
        }}
      />
    );
  }

  if (phase === "building") {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <Analyzing
          done={serverDone}
          error={error}
          onRetry={() => void submit()}
          onComplete={() => setPhase("results")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl flex-col">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Logo />
        <StepDots current={stepIndex} total={steps.length} />
      </div>

      <div className="flex-1 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <ChatBubble key={message.id} role={message.role}>
              {message.text}
            </ChatBubble>
          ))}
        </AnimatePresence>

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TypingIndicator />
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/*
        No mode="wait" here: the input unmounts while the coach is "typing" and
        remounts under a new key immediately after. With mode="wait" that
        sequence wedges AnimatePresence and the input never comes back.
      */}
      <AnimatePresence initial={false}>
        {!thinking && step && (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="sticky bottom-0 mt-6 border-t border-hairline bg-surface pb-4 pt-4"
          >
            <QuestionInput step={step} onAnswer={(value) => void handleAnswer(value)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
