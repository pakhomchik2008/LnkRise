import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingChat } from "@/components/onboarding/onboarding-chat";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Set up your plan",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardedAt: true },
  });

  if (user?.onboardedAt) redirect("/dashboard");

  return <OnboardingChat />;
}
