"use client";

import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[marketing] render failed", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-28 text-center">
      <h1 className="text-2xl font-bold text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        This page failed to render. Try again, or head back to the start.
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="secondary">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
