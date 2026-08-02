"use client";

import { RotateCcw } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app] render failed", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <h1 className="text-xl font-semibold text-ink">This page did not load</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Something failed on the way here. Your plan and your data are untouched — retrying usually
        fixes it.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-[11px] text-ink-muted">Reference: {error.digest}</p>
      )}
      <Button className="mt-6" onClick={reset} icon={<RotateCcw className="size-4" />}>
        Try again
      </Button>
    </div>
  );
}
