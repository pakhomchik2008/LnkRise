"use client";

import { Send } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { publishDraft } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export interface PublishConfig {
  /** False when the API is off, unapproved, or the account is not connected. */
  enabled: boolean;
  /** Marked complete once the post goes out. */
  taskId?: string;
}

/**
 * The confirmation step before anything is published.
 *
 * The user reads the exact text that will be posted, in a dialog that says
 * plainly that it goes out immediately and publicly. Nothing is sent on the
 * strength of the button in the card alone.
 */
export function PublishDialog({ text, config }: { text: string; config: PublishConfig }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [needsReconnect, setNeedsReconnect] = React.useState(false);

  if (!config.enabled) return null;

  async function onConfirm() {
    setPending(true);
    const result = await publishDraft({ text, taskId: config.taskId });
    setPending(false);

    if (result.ok) {
      setOpen(false);
      toast({
        tone: "success",
        title: "Published",
        description: "It is live on your feed now.",
      });
      return;
    }

    setNeedsReconnect(Boolean(result.reconnect));
    toast({ tone: "error", title: result.error });
  }

  return (
    <>
      <Button size="sm" icon={<Send className="size-3.5" />} onClick={() => setOpen(true)}>
        Publish
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Publish this now?"
        description="This posts to your feed immediately, publicly, under your own name. There is no draft step after this."
        footer={
          needsReconnect ? (
            <Link href="/settings">
              <Button variant="secondary">Go to settings</Button>
            </Link>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button onClick={onConfirm} loading={pending}>
                Publish now
              </Button>
            </>
          )
        }
      >
        <div className="max-h-72 overflow-y-auto rounded-[var(--radius-sm)] border border-hairline bg-surface-muted p-3.5">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
            {text}
          </pre>
        </div>

        <p className="mt-3 font-mono text-[11px] text-ink-muted">
          {text.length} characters
        </p>
      </Modal>
    </>
  );
}
