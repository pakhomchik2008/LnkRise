"use client";

import { Bold, CalendarClock, Check, Copy, Save, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { rewriteSelection, saveDraft } from "@/app/(app)/content/actions";
import { PostFeedback } from "@/components/content/post-feedback";
import { PostPreview } from "@/components/content/post-preview";
import { IdeaFlow } from "@/components/content/idea-flow";
import { ScheduleDialog } from "@/components/content/schedule-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { analyzePost, MAX_LENGTH, toUnicodeBold } from "@/lib/post-analysis";
import { cn } from "@/lib/utils";
import type { RewriteMode } from "@/types";

const REWRITE_MODES: { mode: RewriteMode; label: string }[] = [
  { mode: "rewrite", label: "Rewrite" },
  { mode: "shorten", label: "Shorter" },
  { mode: "expand", label: "Longer" },
  { mode: "bolder", label: "Bolder" },
  { mode: "warmer", label: "Warmer" },
];

export interface ContentEditorProps {
  postId?: string;
  initialContent: string;
  authorName: string;
  authorHeadline: string;
  quotaRemaining: number;
  quotaLimit: number;
}

export function ContentEditor({
  postId,
  initialContent,
  authorName,
  authorHeadline,
  quotaRemaining,
  quotaLimit,
}: ContentEditorProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [text, setText] = React.useState(initialContent);
  const [savedId, setSavedId] = React.useState(postId);
  const [remaining, setRemaining] = React.useState(quotaRemaining);
  const [selection, setSelection] = React.useState<{ start: number; end: number } | null>(null);
  const [alternatives, setAlternatives] = React.useState<string[] | null>(null);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [copied, setCopied] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const analysis = React.useMemo(() => analyzePost(text), [text]);

  const selectedText = selection ? text.slice(selection.start, selection.end) : "";

  function captureSelection() {
    const node = textareaRef.current;
    if (!node) return;
    const { selectionStart, selectionEnd } = node;
    setSelection(selectionEnd > selectionStart ? { start: selectionStart, end: selectionEnd } : null);
    setAlternatives(null);
  }

  function replaceSelection(replacement: string) {
    if (!selection) return;
    setText((current) => current.slice(0, selection.start) + replacement + current.slice(selection.end));
    setSelection(null);
    setAlternatives(null);
  }

  function runRewrite(mode: RewriteMode) {
    if (!selection || selectedText.trim().length === 0) return;

    startTransition(async () => {
      const result = await rewriteSelection({ passage: selectedText, mode, fullDraft: text });
      if (!result.ok) {
        if (result.quota) setRemaining(result.quota.remaining);
        toast({ tone: "error", title: result.error });
        return;
      }
      setRemaining(result.quota.remaining);
      setAlternatives(result.alternatives);
    });
  }

  /**
   * Paraphrases the entire draft, not a selection — the ask is "make the
   * whole thing sound right," not "fix this one sentence." Reuses the
   * rewrite pipeline by selecting all of it, so the result lands in the same
   * pick-a-replacement panel as every other rewrite; the whole draft is just
   * what got selected.
   */
  function runParaphrase() {
    const whole = text;
    if (whole.trim().length === 0) return;

    setSelection({ start: 0, end: whole.length });

    startTransition(async () => {
      const result = await rewriteSelection({ passage: whole, mode: "paraphrase", fullDraft: whole });
      if (!result.ok) {
        if (result.quota) setRemaining(result.quota.remaining);
        toast({ tone: "error", title: result.error });
        return;
      }
      setRemaining(result.quota.remaining);
      setAlternatives(result.alternatives);
    });
  }

  function applyBold() {
    if (!selection || selectedText.length === 0) return;
    replaceSelection(toUnicodeBold(selectedText));
    toast({
      tone: "info",
      title: "Bolded with Unicode",
      description:
        "The platform has no real bold, so these are substitute characters. Screen readers do not read them properly — use it sparingly.",
    });
  }

  function save() {
    startTransition(async () => {
      const result = await saveDraft({ id: savedId, content: text, aiGenerated: false });
      if (!result.ok) {
        toast({ tone: "error", title: result.error });
        return;
      }
      setSavedId(result.id);
      toast({ tone: "success", title: "Saved to your drafts" });
      router.refresh();
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({
        tone: "error",
        title: "Could not copy",
        description: "Your browser blocked clipboard access — select the text instead.",
      });
    }
  }

  const overLimit = analysis.characters > MAX_LENGTH;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <IdeaFlow onDraft={(draft) => setText(draft)} onQuota={setRemaining} />

          <Badge tone={remaining === 0 ? "error" : remaining <= 1 ? "warning" : "neutral"} dot>
            {remaining} of {quotaLimit} AI runs left today
          </Badge>
        </div>

        <Card>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={text.trim().length === 0 || pending}
              onClick={runParaphrase}
              icon={<Wand2 className="size-3.5" />}
            >
              Paraphrase
            </Button>

            <span className="h-4 w-px bg-hairline" aria-hidden />

            <Button
              variant="ghost"
              size="sm"
              disabled={!selection}
              onClick={applyBold}
              icon={<Bold className="size-3.5" />}
            >
              Bold
            </Button>

            <span className="h-4 w-px bg-hairline" aria-hidden />

            {REWRITE_MODES.map((entry) => (
              <Button
                key={entry.mode}
                variant="ghost"
                size="sm"
                disabled={!selection || pending}
                onClick={() => runRewrite(entry.mode)}
              >
                {entry.label}
              </Button>
            ))}

            {!selection && (
              <span className="text-xs text-ink-muted">Select a passage to rework it</span>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onSelect={captureSelection}
            onBlur={captureSelection}
            placeholder="Write here, or press Generate ideas to start from a concept."
            rows={16}
            aria-label="Post text"
            className={cn(
              "w-full resize-y rounded-[var(--radius-sm)] border bg-surface px-3 py-3 text-sm leading-relaxed text-ink outline-none transition-colors",
              overLimit ? "border-red-500/50 focus:border-red-500" : "border-hairline focus:border-brand-500",
            )}
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className={cn("text-xs", overLimit ? "font-medium text-red-600" : "text-ink-muted")}>
              {analysis.characters.toLocaleString("en-US")} / {MAX_LENGTH.toLocaleString("en-US")}
              {overLimit && " — over the limit, the platform will reject this"}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={copy}
                disabled={text.length === 0}
                icon={copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setScheduleOpen(true)}
                disabled={text.trim().length === 0 || overLimit}
                icon={<CalendarClock className="size-3.5" />}
              >
                Schedule
              </Button>
              <Button
                size="sm"
                loading={pending}
                onClick={save}
                disabled={text.trim().length === 0 || overLimit}
                icon={<Save className="size-3.5" />}
              >
                {savedId ? "Save changes" : "Save draft"}
              </Button>
            </div>
          </div>
        </Card>

        <ScheduleDialog
          open={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          postId={savedId}
          content={text}
        />

        {alternatives && (
          <Card>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Wand2 aria-hidden className="size-4 text-brand-600" />
              Pick a replacement
            </p>
            <p className="mb-3 text-xs text-ink-muted">
              {selection?.start === 0 && selection.end === text.length ? (
                "Replacing the whole draft."
              ) : (
                <>
                  Replacing: &ldquo;{selectedText.slice(0, 90)}
                  {selectedText.length > 90 ? "…" : ""}&rdquo;
                </>
              )}
            </p>

            <div className="space-y-2">
              {alternatives.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => replaceSelection(option)}
                  className="block w-full rounded-[var(--radius-sm)] border border-hairline bg-surface p-3 text-left text-sm leading-relaxed text-ink transition-colors duration-150 hover:border-brand-400"
                >
                  {option}
                </button>
              ))}
            </div>

            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAlternatives(null)}>
              Keep what I had
            </Button>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <PostPreview text={text} authorName={authorName} authorHeadline={authorHeadline} />
        </Card>

        <Card>
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Sparkles aria-hidden className="size-4 text-brand-600" />
            Read on this draft
          </p>
          <PostFeedback analysis={analysis} />
        </Card>
      </div>
    </div>
  );
}
