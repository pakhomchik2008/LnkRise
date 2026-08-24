"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { syncLinkedInAnalytics } from "@/app/(app)/analytics/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Manual trigger for the official Community Management API pull. This is the
 * self-service way to actually verify that integration against a real,
 * connected account — the request shapes were written against the published
 * docs but never exercised end to end. Surfacing it here rather than
 * pretending it is silently wired up already.
 */
export function LinkedInSyncButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);

  async function onSync() {
    setPending(true);
    const outcome = await syncLinkedInAnalytics();
    setPending(false);

    if (!outcome.ok) {
      toast({ tone: "error", title: outcome.message });
      return;
    }

    if (outcome.daysWritten === 0) {
      toast({ tone: "info", title: "Connected, but the API returned no data for this window." });
    } else {
      toast({ tone: "success", title: `Synced ${outcome.daysWritten} day(s) from LinkedIn` });
    }
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" loading={pending} onClick={onSync} icon={<RefreshCw className="size-4" />}>
      Sync from LinkedIn
    </Button>
  );
}
