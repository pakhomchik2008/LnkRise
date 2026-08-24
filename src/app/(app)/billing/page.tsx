import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckIcon, XIcon } from "lucide-react";
import { CheckoutButton, ManageBillingButton } from "@/components/billing/billing-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserId } from "@/lib/auth";
import { PLANS, effectivePlan } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { stripeEnabled } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const userId = await requireUserId();
  const { checkout } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true, trialEndsAt: true } },
    },
  });

  if (!user) redirect("/login");

  const plan = effectivePlan(user.subscription);
  const isPro = plan === "pro";
  const isStarter = plan === "starter";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Billing</h1>
        <p className="mt-1 text-sm text-ink-muted">Your plan, invoices and upgrades.</p>
      </header>

      {checkout === "success" && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-accent-green/30 bg-accent-green/10 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckIcon aria-hidden className="size-4" />
          Payment received — your plan is active.
        </div>
      )}
      {checkout === "cancelled" && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-hairline bg-surface px-4 py-3 text-sm text-ink-muted">
          <XIcon aria-hidden className="size-4" />
          Checkout was cancelled — nothing was charged.
        </div>
      )}

      {!stripeEnabled() && (
        <Card className="border-amber-300 bg-amber-50">
          <p className="text-sm text-amber-900">
            Billing isn&rsquo;t configured on this deployment — add{" "}
            <code className="font-mono text-xs">STRIPE_SECRET_KEY</code>,{" "}
            <code className="font-mono text-xs">STRIPE_PRICE_STARTER</code> and{" "}
            <code className="font-mono text-xs">STRIPE_PRICE_PRO</code> to enable checkout.
          </p>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>
              {isPro && user.subscription?.currentPeriodEnd
                ? `Renews ${user.subscription.currentPeriodEnd.toLocaleDateString()}`
                : isStarter && user.subscription?.currentPeriodEnd
                  ? `Access ends ${user.subscription.currentPeriodEnd.toLocaleDateString()}`
                  : user.subscription?.trialEndsAt
                    ? `Trial ends ${user.subscription.trialEndsAt.toLocaleDateString()}`
                    : "No active plan"}
            </CardDescription>
          </div>
          <Badge tone={isPro || isStarter ? "success" : "neutral"} className="capitalize">
            {plan}
          </Badge>
        </CardHeader>

        {isPro && <ManageBillingButton />}
      </Card>

      {!isPro && (
        <div className="grid gap-4 sm:grid-cols-2">
          {PLANS.filter((p) => p.id === "starter" || p.id === "pro").map((planDef) => (
            <Card key={planDef.id} className="flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">{planDef.name}</h2>
                <p className="text-2xl font-bold tabular-nums text-ink">
                  {planDef.price}
                  <span className="text-sm font-medium text-ink-muted"> {planDef.priceNote}</span>
                </p>
                <p className="mt-1 text-sm text-ink-muted">{planDef.tagline}</p>
              </div>
              {stripeEnabled() ? (
                <CheckoutButton planId={planDef.id as "starter" | "pro"}>{planDef.cta}</CheckoutButton>
              ) : (
                <p className="text-xs text-ink-muted">Configure Stripe to enable this.</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
