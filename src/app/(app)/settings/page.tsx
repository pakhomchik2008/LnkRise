import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ConnectionsSection,
  DangerZone,
  PreferencesSection,
  ProfileSection,
  type SettingsUser,
} from "@/components/settings/settings-forms";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      linkedinUrl: true,
      emailBriefEnabled: true,
      emailBriefHour: true,
      timezone: true,
      language: true,
      postingFrequency: true,
      contentTone: true,
      dailyTimeBudget: true,
      accounts: { select: { provider: true } },
      subscription: { select: { plan: true } },
    },
  });

  if (!user) redirect("/login");

  const view: SettingsUser = {
    ...user,
    providers: user.accounts.map((account) => account.provider),
    plan: user.subscription?.plan ?? "trial",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Your account, how the plan is shaped, and how it reaches you.
        </p>
      </header>

      <ProfileSection user={view} />
      <PreferencesSection user={view} />
      <ConnectionsSection user={view} />
      <DangerZone user={view} />
    </div>
  );
}
