"use client";

import * as React from "react";
import { openBillingPortal, startCheckout } from "@/app/(app)/billing/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

function useRedirect() {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);

  async function run(action: () => Promise<{ ok: boolean; url?: string; error?: string }>) {
    setPending(true);
    const result = await action();
    setPending(false);

    if (result.ok && result.url) {
      window.location.href = result.url;
    } else {
      toast({ tone: "error", title: result.error ?? "Something went wrong." });
    }
  }

  return { pending, run };
}

export function CheckoutButton({
  planId,
  children,
}: {
  planId: "starter" | "pro";
  children: React.ReactNode;
}) {
  const { pending, run } = useRedirect();

  return (
    <Button onClick={() => run(() => startCheckout(planId))} loading={pending} className="w-full">
      {children}
    </Button>
  );
}

export function ManageBillingButton() {
  const { pending, run } = useRedirect();

  return (
    <Button variant="secondary" onClick={() => run(openBillingPortal)} loading={pending}>
      Manage billing
    </Button>
  );
}
