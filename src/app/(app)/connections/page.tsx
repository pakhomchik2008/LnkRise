import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConnectionLanes } from "@/components/connections/connection-lanes";
import { requireUserId } from "@/lib/auth";
import { PLAN_ACCESS, effectivePlan } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { ConnectionPlan } from "@/types";

export const metadata: Metadata = {
  title: "Connections",
  robots: { index: false, follow: false },
};

export default async function ConnectionsPage() {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      onboardedAt: true,
      connectionPlan: true,
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
    },
  });

  if (!user?.onboardedAt) redirect("/onboarding");

  const plan = (user.connectionPlan as unknown as ConnectionPlan | null) ?? null;

  // The nav badges this page "Pro", so the page has to behave that way.
  // Trial keeps the first lane in full — enough to judge whether the rest is
  // worth paying for — and the other three are described but not spelled out.
  // Every account is on trial until billing lands in Phase 6, so this is what
  // is on screen today; it starts unlocking the moment a plan can be bought.
  const subscriptionPlan = effectivePlan(user.subscription);
  const unlocked = PLAN_ACCESS[subscriptionPlan].connectionStrategy;

  // Redact here rather than hiding in the client: a locked lane's query and
  // message must not reach the browser at all, or the whole gate is one
  // "view source" away from being pointless.
  const visible: ConnectionPlan | null =
    plan && !unlocked
      ? {
          ...plan,
          categories: plan.categories.map((category, index) =>
            index === 0 ? category : { ...category, searchQuery: "", message: "" },
          ),
        }
      : plan;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-ink">Connections</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Four kinds of people worth knowing, and what to say to each. Work one lane at a time
          rather than sending the same note to everyone.
        </p>
      </header>

      <ConnectionLanes plan={visible} unlocked={unlocked} />
    </div>
  );
}
