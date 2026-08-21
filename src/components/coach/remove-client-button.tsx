"use client";

import { useTransition } from "react";
import { removeClient } from "@/app/(app)/coach/actions";
import { Button } from "@/components/ui/button";

export function RemoveClientButton({ clientId }: { clientId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={(event) => {
        event.preventDefault();
        if (!confirm("Remove this client? Their account and data stay intact, just unlinked from you.")) return;
        startTransition(() => removeClient(clientId));
      }}
    >
      Remove
    </Button>
  );
}
