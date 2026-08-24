import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExtensionSection, type KeyView } from "@/components/settings/extension-section";
import { InspirationsSection } from "@/components/settings/inspirations-section";
import {
  ConnectionsSection,
  DangerZone,
  PreferencesSection,
  ProfileSection,
  type SettingsUser,
} from "@/components/settings/settings-forms";
import { requireUserId } from "@/lib/auth";
import { effectivePlan } from "@/lib/constants";
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
      inspirations: true,
      accounts: { select: { provider: true } },
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
      apiKeys: {
        where: { revokedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, label: true, prefix: true, lastUsedAt: true, createdAt: true },
      },
    },
  });

  if (!user) redirect("/login");

  const keys: KeyView[] = user.apiKeys;

  const view: SettingsUser = {
    ...user,
    providers: user.accounts.map((account) => account.provider),
    plan: effectivePlan(user.subscription),
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
      <InspirationsSection initial={user.inspirations} />
      <ExtensionSection keys={keys} />
      <ConnectionsSection user={view} />
      <DangerZone user={view} />
    </div>
  );
}
