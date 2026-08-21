import { redirect } from "next/navigation";
import { BrandingForm } from "@/components/coach/branding-form";
import { Card } from "@/components/ui/card";
import { requireCoachId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CoachSettingsPage() {
  let coachId: string;
  try {
    coachId = await requireCoachId();
  } catch {
    redirect("/dashboard");
  }

  const coach = await prisma.user.findUniqueOrThrow({
    where: { id: coachId },
    select: { brandName: true, brandLogoUrl: true, brandColor: true },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight text-ink">White-label</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Your clients see this in their sidebar instead of LnkRise. No client sees this page or your other clients.
      </p>

      <Card className="mt-6 p-5">
        <BrandingForm
          brandName={coach.brandName ?? ""}
          brandLogoUrl={coach.brandLogoUrl ?? ""}
          brandColor={coach.brandColor ?? ""}
        />
      </Card>
    </div>
  );
}
