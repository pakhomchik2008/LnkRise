"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Trash2 } from "lucide-react";
import * as React from "react";
import { issueApiKey, revokeKey } from "@/app/(app)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export interface KeyView {
  id: string;
  label: string;
  prefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export function ExtensionSection({ keys }: { keys: KeyView[] }) {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [issued, setIssued] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function onIssue() {
    setPending(true);
    const result = await issueApiKey();
    setPending(false);

    if (result.ok) setIssued(result.raw);
    else toast({ tone: "error", title: result.error });
  }

  async function onRevoke(id: string) {
    const result = await revokeKey(id);
    if (result.ok) toast({ tone: "success", title: "Key revoked" });
    else toast({ tone: "error", title: result.error });
  }

  async function copy() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ tone: "error", title: "Could not copy — select the key and copy it manually." });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Browser extension</CardTitle>
          <CardDescription>
            Reads the numbers from your own analytics page so you do not have to type them.
          </CardDescription>
        </div>
      </CardHeader>

      <div className="rounded-[var(--radius-sm)] border border-accent-orange/30 bg-accent-orange/[0.07] p-3">
        <p className="text-xs font-semibold text-orange-800">Read this before installing</p>
        <p className="mt-1.5 text-xs leading-relaxed text-orange-900/80">
          The extension reads a page you have already opened, in your own browser session, and only
          on <code className="font-mono">/analytics/</code> and{" "}
          <code className="font-mono">/dashboard/</code>. It never clicks, posts, navigates, or
          touches anyone else&rsquo;s data, and it only runs when you press its button.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-orange-900/80">
          Even so: reading page content with a script sits in a grey area of most platforms&rsquo;
          terms of service. The risk, if any, lands on your account rather than ours. The manual
          form stays available and carries no such question — use it if you would rather not.
        </p>
      </div>

      <AnimatePresence>
        {issued && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="rounded-[var(--radius-sm)] border border-brand-300 bg-brand-50/60 p-3">
              <p className="text-xs font-semibold text-brand-800">
                Copy this now — it is not shown again
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-surface px-2 py-1.5 font-mono text-[11px]">
                  {issued}
                </code>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={copy}
                  icon={copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setIssued(null)}
                className="mt-2 text-xs font-medium text-brand-700 underline-offset-2 hover:underline"
              >
                I have saved it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {keys.length > 0 && (
        <ul className="mt-4 space-y-2">
          {keys.map((key) => (
            <li
              key={key.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-hairline px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-ink">{key.prefix}…</p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  {key.lastUsedAt
                    ? `Last used ${key.lastUsedAt.toLocaleDateString("en-GB")}`
                    : "Never used"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={key.lastUsedAt ? "success" : "neutral"} dot>
                  {key.lastUsedAt ? "Active" : "Unused"}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Revoke key"
                  onClick={() => void onRevoke(key.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button className="mt-4" variant="secondary" loading={pending} onClick={onIssue}>
        Create an ingest key
      </Button>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-medium text-ink-muted">
          How to install it
        </summary>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-ink-muted">
          <li>Open <code className="font-mono">chrome://extensions</code> and turn on Developer mode.</li>
          <li>Choose &ldquo;Load unpacked&rdquo; and select the <code className="font-mono">extension/</code> folder in this repository.</li>
          <li>Click the LnkRise icon, paste the key above, and confirm the app URL.</li>
          <li>Open your analytics page, click the icon, then &ldquo;Read this page&rdquo;.</li>
        </ol>
      </details>
    </Card>
  );
}
