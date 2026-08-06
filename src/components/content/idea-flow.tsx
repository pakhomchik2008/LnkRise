"use client";

import { motion } from "framer-motion";
import { ArrowRight, Lightbulb, Plus, X } from "lucide-react";
import * as React from "react";
import {
  draftFromOutline,
  outlineConcept,
  suggestConcepts,
} from "@/app/(app)/content/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { PostConcept, PostOutline } from "@/types";

const ENTRANCE = { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } as const;

type Stage =
  | { name: "idle" }
  | { name: "concepts"; concepts: PostConcept[] }
  | { name: "outline"; outline: PostOutline };

/**
 * Concepts, then an outline, then the draft.
 *
 * The outline step is not decoration: redirecting a wrong angle costs one
 * edited bullet point here, versus explaining what is wrong with 1,200
 * finished characters if we jumped straight to prose.
 */
export function IdeaFlow({
  onDraft,
  onQuota,
}: {
  onDraft: (draft: string) => void;
  onQuota: (remaining: number) => void;
}) {
  const { toast } = useToast();
  const [stage, setStage] = React.useState<Stage>({ name: "idle" });
  const [pending, startTransition] = React.useTransition();

  function fail(error: string) {
    toast({ tone: "error", title: error });
  }

  function getConcepts() {
    startTransition(async () => {
      const result = await suggestConcepts();
      if (!result.ok) {
        if (result.quota) onQuota(result.quota.remaining);
        fail(result.error);
        return;
      }
      onQuota(result.quota.remaining);
      setStage({ name: "concepts", concepts: result.concepts });
    });
  }

  function chooseConcept(concept: PostConcept) {
    startTransition(async () => {
      const result = await outlineConcept({ topic: concept.topic, angle: concept.angle });
      if (!result.ok) {
        if (result.quota) onQuota(result.quota.remaining);
        fail(result.error);
        return;
      }
      onQuota(result.quota.remaining);
      setStage({ name: "outline", outline: result.outline });
    });
  }

  function writeDraft(outline: PostOutline) {
    startTransition(async () => {
      const result = await draftFromOutline(outline);
      if (!result.ok) {
        if (result.quota) onQuota(result.quota.remaining);
        fail(result.error);
        return;
      }
      onQuota(result.quota.remaining);
      onDraft(result.draft);
      setStage({ name: "idle" });
      toast({
        tone: "success",
        title: "Draft ready",
        description: "Edit anything — select a passage to rework it.",
      });
    });
  }

  function editPoint(index: number, value: string) {
    setStage((current) => {
      if (current.name !== "outline") return current;
      return {
        ...current,
        outline: {
          ...current.outline,
          points: current.outline.points.map((point, position) =>
            position === index ? value : point,
          ),
        },
      };
    });
  }

  if (stage.name === "idle") {
    return (
      <Button
        variant="secondary"
        size="sm"
        loading={pending}
        onClick={getConcepts}
        icon={<Lightbulb className="size-3.5" />}
      >
        Generate ideas
      </Button>
    );
  }

  if (stage.name === "concepts") {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-muted/40 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">Pick one to develop</p>
          <button
            type="button"
            aria-label="Close ideas"
            onClick={() => setStage({ name: "idle" })}
            className="text-ink-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-2">
          {stage.concepts.map((concept, index) => (
            <motion.button
              key={concept.topic}
              type="button"
              disabled={pending}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...ENTRANCE, delay: index * 0.05 }}
              onClick={() => chooseConcept(concept)}
              className="block w-full rounded-[var(--radius-sm)] border border-hairline bg-surface p-3 text-left transition-colors duration-150 hover:border-brand-400 disabled:opacity-60"
            >
              <p className="text-sm font-medium text-ink">{concept.topic}</p>
              <p className="mt-1 text-xs text-ink-muted">{concept.angle}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{concept.why}</p>
            </motion.button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          loading={pending}
          onClick={getConcepts}
          icon={<Plus className="size-3.5" />}
        >
          Different ideas
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-muted/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Check the outline before it is written</p>
        <button
          type="button"
          aria-label="Close outline"
          onClick={() => setStage({ name: "idle" })}
          className="text-ink-muted hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>

      <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="outline-hook">
        Opening line
      </label>
      <input
        id="outline-hook"
        value={stage.outline.hook}
        onChange={(event) =>
          setStage((current) =>
            current.name === "outline"
              ? { ...current, outline: { ...current.outline, hook: event.target.value } }
              : current,
          )
        }
        className="mb-3 w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-500"
      />

      <p className="mb-1 text-xs font-medium text-ink-muted">Points, in order</p>
      <div className="mb-3 space-y-2">
        {stage.outline.points.map((point, index) => (
          <input
            key={index}
            value={point}
            aria-label={`Point ${index + 1}`}
            onChange={(event) => editPoint(index, event.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-500"
          />
        ))}
      </div>

      <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="outline-cta">
        Closing line
      </label>
      <input
        id="outline-cta"
        value={stage.outline.cta}
        onChange={(event) =>
          setStage((current) =>
            current.name === "outline"
              ? { ...current, outline: { ...current.outline, cta: event.target.value } }
              : current,
          )
        }
        className="mb-4 w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-500"
      />

      <Button
        size="sm"
        loading={pending}
        onClick={() => writeDraft(stage.outline)}
        icon={<ArrowRight className="size-3.5" />}
        iconPosition="right"
      >
        Write it
      </Button>
    </div>
  );
}
