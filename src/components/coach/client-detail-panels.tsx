"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { addCoachNote, deleteCoachNote, overrideTodaysBrief } from "@/app/(app)/coach/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface Note {
  id: string;
  body: string;
  createdAt: string;
}

export function CoachNotesPanel({ clientId, notes }: { clientId: string; notes: Note[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);

  async function onAdd(formData: FormData) {
    setPending(true);
    const result = await addCoachNote(clientId, formData);
    setPending(false);

    if (result.error) {
      toast({ tone: "error", title: result.error });
      return;
    }
    (document.getElementById("note-form") as HTMLFormElement | null)?.reset();
    router.refresh();
  }

  async function onDelete(noteId: string) {
    await deleteCoachNote(clientId, noteId);
    router.refresh();
  }

  return (
    <Card className="mt-4 p-5">
      <CardHeader>
        <div>
          <CardTitle>Private notes</CardTitle>
          <CardDescription>Only you see these — never shown to the client.</CardDescription>
        </div>
      </CardHeader>

      <form id="note-form" action={onAdd} className="flex items-start gap-2">
        <textarea
          name="body"
          required
          maxLength={2000}
          rows={2}
          placeholder="Something worth remembering before your next check-in…"
          className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand-500"
        />
        <Button type="submit" loading={pending} size="sm">
          Add
        </Button>
      </form>

      {notes.length > 0 && (
        <ul className="mt-4 space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-3 rounded-[var(--radius-sm)] border border-hairline p-3"
            >
              <div className="min-w-0">
                <p className="whitespace-pre-wrap text-sm text-ink">{note.body}</p>
                <p className="mt-1 text-[11px] text-ink-muted">{note.createdAt}</p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(note.id)}
                className="shrink-0 text-xs text-ink-muted transition-colors hover:text-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

interface BriefOverrideDefaults {
  todayFocus: string;
  postTopic: string;
  postHook: string;
  optimizationTitle: string;
  optimizationDetail: string;
}

export function BriefOverridePanel({
  clientId,
  defaults,
}: {
  clientId: string;
  defaults: BriefOverrideDefaults | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await overrideTodaysBrief(clientId, formData);
    setPending(false);

    if (result.error) {
      toast({ tone: "error", title: result.error });
      return;
    }
    toast({ tone: "success", title: "Brief updated" });
    router.refresh();
  }

  if (!defaults) {
    return (
      <Card className="mt-4 p-5">
        <CardHeader>
          <div>
            <CardTitle>Override today&rsquo;s brief</CardTitle>
            <CardDescription>No brief generated yet today — nothing to override.</CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-4 p-5">
      <CardHeader>
        <div>
          <CardTitle>Override today&rsquo;s brief</CardTitle>
          <CardDescription>
            Replaces the focus, post idea and tip the AI generated. Outreach and comment targets stay as generated.
          </CardDescription>
        </div>
      </CardHeader>

      <form action={onSubmit} className="space-y-3">
        <Input label="Today's focus" name="todayFocus" defaultValue={defaults.todayFocus} required maxLength={200} />
        <Input label="Post topic" name="postTopic" defaultValue={defaults.postTopic} required maxLength={200} />
        <Input label="Post hook" name="postHook" defaultValue={defaults.postHook} maxLength={300} />
        <Input
          label="Optimization tip — title"
          name="optimizationTitle"
          defaultValue={defaults.optimizationTitle}
          maxLength={120}
        />
        <Input
          label="Optimization tip — detail"
          name="optimizationDetail"
          defaultValue={defaults.optimizationDetail}
          maxLength={500}
        />
        <Button type="submit" loading={pending} size="sm">
          Save override
        </Button>
      </form>
    </Card>
  );
}
