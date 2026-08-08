"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { deleteFact, saveFact } from "@/app/(app)/facts/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { FACT_KIND_HINTS, FACT_KIND_LABELS, factCoverage, type FactKind, type FactQuestion } from "@/lib/facts";
import { cn } from "@/lib/utils";
import type { UserFact } from "@/types";

const ENTRANCE = { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } as const;

const COVERAGE_TONE = {
  none: "error",
  thin: "warning",
  workable: "info",
  good: "success",
} as const;

export function FactBank({
  facts,
  questions,
}: {
  facts: UserFact[];
  questions: FactQuestion[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<{ fact?: UserFact; question: string; kind: FactKind } | null>(
    null,
  );
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const coverage = factCoverage(facts.length);
  const answered = new Set(facts.map((fact) => fact.question));
  const unanswered = questions.filter((entry) => !answered.has(entry.question));

  function open(question: string, kind: FactKind, fact?: UserFact) {
    setEditing({ question, kind, fact });
    setBody(fact?.body ?? "");
  }

  function submit() {
    if (!editing) return;

    startTransition(async () => {
      const result = await saveFact({
        id: editing.fact?.id,
        question: editing.question,
        body,
        kind: editing.kind,
      });

      if (!result.ok) {
        toast({ tone: "error", title: result.error });
        return;
      }

      toast({ tone: "success", title: editing.fact ? "Updated" : "Added to your bank" });
      setEditing(null);
      setBody("");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteFact(id);
      if (!result.ok) {
        toast({ tone: "error", title: result.error });
        return;
      }
      toast({ tone: "success", title: "Removed" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card
        className={cn(
          coverage.level === "none" && "border-red-500/30 bg-red-500/[0.04]",
          coverage.level === "thin" && "border-accent-orange/30 bg-accent-orange/[0.04]",
        )}
      >
        <div className="flex items-start gap-3">
          {coverage.level === "none" || coverage.level === "thin" ? (
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-red-500/12">
              <AlertTriangle aria-hidden className="size-4 text-red-600" />
            </div>
          ) : (
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-green/15">
              <Check aria-hidden className="size-4 text-emerald-700" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-ink">
                {facts.length} {facts.length === 1 ? "thing" : "things"} on record
              </p>
              <Badge tone={COVERAGE_TONE[coverage.level]} dot>
                {coverage.level === "none"
                  ? "Nothing specific"
                  : coverage.level === "thin"
                    ? "Thin"
                    : coverage.level === "workable"
                      ? "Workable"
                      : "Good"}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{coverage.note}</p>
          </div>
        </div>
      </Card>

      {unanswered.length > 0 && (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-ink">Questions worth answering</h2>
          <p className="mb-3 max-w-2xl text-xs leading-relaxed text-ink-muted">
            Each one is written to be impossible to answer in the abstract. That is the point — a
            category produces a template, a specific answer produces a post only you could write.
          </p>

          <div className="space-y-2">
            {unanswered.slice(0, 6).map((entry, index) => (
              <motion.button
                key={entry.question}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...ENTRANCE, delay: Math.min(index, 6) * 0.04 }}
                onClick={() => open(entry.question, entry.kind)}
                className="flex w-full items-start gap-3 rounded-[var(--radius-md)] border border-dashed border-hairline bg-surface p-3 text-left transition-colors duration-150 hover:border-brand-400"
              >
                <Plus aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed text-ink">{entry.question}</p>
                  <p className="mt-1 text-xs text-ink-muted">{FACT_KIND_LABELS[entry.kind]}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {facts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">What we know</h2>
          <div className="space-y-2">
            {facts.map((fact, index) => (
              <motion.div
                key={fact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...ENTRANCE, delay: Math.min(index, 8) * 0.04 }}
              >
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs leading-relaxed text-ink-muted">{fact.question}</p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                        {fact.body}
                      </p>
                      <Badge tone="neutral" className="mt-2">
                        {FACT_KIND_LABELS[fact.kind as FactKind] ?? fact.kind}
                      </Badge>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label="Edit"
                        disabled={pending}
                        onClick={() => open(fact.question, fact.kind as FactKind, fact)}
                        className="rounded-[var(--radius-sm)] p-1.5 text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink disabled:opacity-50"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete"
                        disabled={pending}
                        onClick={() => remove(fact.id)}
                        className="rounded-[var(--radius-sm)] p-1.5 text-ink-muted transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.fact ? "Edit this" : "Add to your bank"}
        description={editing?.question}
      >
        {editing && (
          <div>
            <p className="mb-3 text-xs leading-relaxed text-ink-muted">
              {FACT_KIND_HINTS[editing.kind]}
            </p>

            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={6}
              autoFocus
              aria-label="Your answer"
              placeholder="Your own words. Names, numbers and dates are what make it usable."
              className="w-full resize-y rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink outline-none focus:border-brand-500"
            />

            <p className="mt-2 text-xs text-ink-muted">
              Stored exactly as you write it. Nothing rewrites this — it is the one part of a draft
              that a model could not have invented.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button loading={pending} onClick={submit} disabled={body.trim().length === 0}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
