"use client";

import { useActionState } from "react";
import { addClient } from "@/app/(app)/coach/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { error: null as string | null };

export function AddClientForm() {
  const [state, formAction, pending] = useActionState(async (_: typeof initialState, formData: FormData) => {
    const result = await addClient(formData);
    return result;
  }, initialState);

  return (
    <form action={formAction} className="flex items-start gap-3">
      <Input
        name="email"
        type="email"
        required
        label="Client email"
        error={state.error}
        className="max-w-xs"
      />
      <Button type="submit" loading={pending} className="mt-1">
        Add client
      </Button>
    </form>
  );
}
