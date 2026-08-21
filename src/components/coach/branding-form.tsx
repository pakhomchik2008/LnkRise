"use client";

import { useActionState } from "react";
import { updateBranding } from "@/app/(app)/coach/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { error: null as string | null };

export function BrandingForm({
  brandName,
  brandLogoUrl,
  brandColor,
}: {
  brandName: string;
  brandLogoUrl: string;
  brandColor: string;
}) {
  const [state, formAction, pending] = useActionState(async (_: typeof initialState, formData: FormData) => {
    return updateBranding(formData);
  }, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Input name="brandName" label="Agency name" defaultValue={brandName} placeholder="Shown in your clients' sidebar" />
      <Input name="brandLogoUrl" label="Logo URL" defaultValue={brandLogoUrl} placeholder="https://…" hint="Optional. Falls back to your agency name if empty." />
      <Input
        name="brandColor"
        label="Accent color"
        defaultValue={brandColor}
        placeholder="#2b59ff"
        error={state.error}
      />
      <Button type="submit" loading={pending}>
        Save branding
      </Button>
    </form>
  );
}
