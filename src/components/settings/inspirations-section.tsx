"use client";

import { Plus, X } from "lucide-react";
import * as React from "react";
import { updateInspirations } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function InspirationsSection({ initial }: { initial: string[] }) {
  const { toast } = useToast();
  const [urls, setUrls] = React.useState<string[]>(initial.length > 0 ? initial : [""]);
  const [pending, setPending] = React.useState(false);

  function setAt(index: number, value: string) {
    setUrls((current) => current.map((url, i) => (i === index ? value : url)));
  }

  function removeAt(index: number) {
    setUrls((current) => current.filter((_, i) => i !== index));
  }

  async function onSave() {
    setPending(true);
    const result = await updateInspirations(urls.map((url) => url.trim()).filter(Boolean));
    setPending(false);

    if (result.ok) toast({ tone: "success", title: "Saved" });
    else toast({ tone: "error", title: result.error ?? "Could not save" });
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>People you admire</CardTitle>
          <CardDescription>
            Up to 3 profile URLs. The daily brief names them directly in comment suggestions instead of
            describing a category.
          </CardDescription>
        </div>
      </CardHeader>

      <div className="space-y-2">
        {urls.map((url, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              label={`Profile URL ${index + 1}`}
              value={url}
              onChange={(event) => setAt(index, event.target.value)}
              type="url"
              placeholder="https://www.linkedin.com/in/…"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label="Remove"
              className="rounded-[var(--radius-sm)] p-2 text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}

        {urls.length < 3 && (
          <button
            type="button"
            onClick={() => setUrls((current) => [...current, ""])}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            <Plus aria-hidden className="size-4" />
            Add another
          </button>
        )}
      </div>

      <Button type="button" onClick={onSave} loading={pending}>
        Save
      </Button>
    </Card>
  );
}
