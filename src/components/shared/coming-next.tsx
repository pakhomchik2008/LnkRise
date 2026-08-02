import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Honest placeholder for the sections that arrive in later phases. The nav
 * links to real pages rather than dead ends, and the page says plainly what
 * is and is not built.
 */
export function ComingNext({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>

      <EmptyState
        className="mt-8"
        title={`Arrives in ${phase}`}
        description="The data model and the coaching engine behind this page are already in place — the interface is what is still to come."
        action={
          <Link href="/dashboard">
            <Button variant="secondary">Back to the dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
