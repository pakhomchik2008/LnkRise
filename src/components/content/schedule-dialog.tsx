"use client";

import { CalendarClock, Lock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { schedulePost, suggestedPostTime } from "@/app/(app)/content/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { BestTime } from "@/lib/best-time";

/** yyyy-MM-ddThh:mm in the visitor's own timezone, for the datetime-local input's min. */
function nowLocalInputValue(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

function SuggestedTime() {
  const [state, setState] = React.useState<
    { status: "loading" } | { status: "locked" } | { status: "ready"; time: BestTime } | { status: "error" }
  >({ status: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    void suggestedPostTime().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setState({ status: "error" });
      } else if (result.locked) {
        setState({ status: "locked" });
      } else {
        setState({ status: "ready", time: result.time });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading" || state.status === "error") return null;

  if (state.status === "locked") {
    return (
      <div className="mb-4 flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-dashed border-hairline p-3">
        <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
            SUGGESTED TIME
            <Badge tone="premium">
              <Lock aria-hidden className="mr-1 inline size-3" />
              Pro
            </Badge>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            When to post, built from your own published posts once you have enough of them — or
            general practice until you do. Part of Pro.
          </p>
        </div>
      </div>
    );
  }

  const { time } = state;

  return (
    <div className="mb-4 rounded-[var(--radius-sm)] border border-hairline bg-surface-muted/50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
        <Sparkles aria-hidden className="size-3.5 text-brand-600" />
        SUGGESTED TIME
        <Badge tone={time.kind === "measured" ? "success" : "neutral"}>
          {time.kind === "measured" ? "Your data" : "General guidance"}
        </Badge>
      </p>
      <p className="mt-1.5 text-sm font-medium text-ink">{time.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{time.detail}</p>
    </div>
  );
}

export function ScheduleDialog({
  open,
  onClose,
  postId,
  content,
  title,
}: {
  open: boolean;
  onClose: () => void;
  postId?: string;
  content: string;
  title?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [when, setWhen] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function confirm() {
    if (!when) {
      toast({ tone: "error", title: "Pick a date and time first." });
      return;
    }

    startTransition(async () => {
      const result = await schedulePost({
        id: postId,
        title,
        content,
        // datetime-local has no timezone; new Date() on the client resolves
        // it against the visitor's own zone, which is what the picker showed.
        scheduledAt: new Date(when).toISOString(),
      });

      if (!result.ok) {
        toast({ tone: "error", title: result.error });
        return;
      }

      toast({
        tone: "success",
        title: "Scheduled",
        description: "We will email a reminder when it is time — posting itself is still up to you.",
      });
      onClose();
      router.push("/content");
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule this post"
      description="We remind you when it's time. Nothing is posted for you — the platform's own publishing API is not open to this app yet."
    >
      <SuggestedTime />

      <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="schedule-when">
        Date and time
      </label>
      <input
        id="schedule-when"
        type="datetime-local"
        value={when}
        min={nowLocalInputValue()}
        onChange={(event) => setWhen(event.target.value)}
        className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-500"
      />

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={pending} onClick={confirm} icon={<CalendarClock className="size-4" />}>
          Schedule
        </Button>
      </div>
    </Modal>
  );
}
