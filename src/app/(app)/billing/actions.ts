"use server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STRIPE_PRICE_IDS, appUrl, stripe, stripeEnabled } from "@/lib/stripe";

type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Starts a Stripe Checkout session for the given plan. Starter is a one-time
 * 15-day pass (`mode: "payment"`); Pro is a real recurring subscription
 * (`mode: "subscription"`). The webhook, not this action, is what actually
 * grants access — this only ever redirects to Stripe.
 */
export async function startCheckout(planId: "starter" | "pro"): Promise<CheckoutResult> {
  if (!stripeEnabled()) {
    return { ok: false, error: "Billing isn't configured on this deployment yet." };
  }

  const userId = await requireUserId();
  const priceId = STRIPE_PRICE_IDS[planId];
  if (!priceId) {
    return { ok: false, error: `No Stripe price is configured for the ${planId} plan.` };
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, subscription: { select: { stripeCustomerId: true } } },
  });

  let customerId = user.subscription?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe().customers.create({ email: user.email, metadata: { userId } });
    customerId = customer.id;
    await prisma.subscription.upsert({
      where: { userId },
      update: { stripeCustomerId: customerId },
      create: { userId, stripeCustomerId: customerId },
    });
  }

  const base = appUrl();

  try {
    const session = await stripe().checkout.sessions.create({
      customer: customerId,
      mode: planId === "pro" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/billing?checkout=success`,
      cancel_url: `${base}/billing?checkout=cancelled`,
      metadata: { userId, planId },
      subscription_data: planId === "pro" ? { metadata: { userId } } : undefined,
    });

    if (!session.url) return { ok: false, error: "Stripe did not return a checkout URL." };
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("[billing] failed to start checkout", error);
    return { ok: false, error: "Could not start checkout. Try again in a moment." };
  }
}

/** Stripe's self-serve portal: cancel, swap plan, update card, see invoices. */
export async function openBillingPortal(): Promise<CheckoutResult> {
  if (!stripeEnabled()) {
    return { ok: false, error: "Billing isn't configured on this deployment yet." };
  }

  const userId = await requireUserId();
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (!subscription?.stripeCustomerId) {
    return { ok: false, error: "No billing account yet — start a plan first." };
  }

  try {
    const portal = await stripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl()}/billing`,
    });
    return { ok: true, url: portal.url };
  } catch (error) {
    console.error("[billing] failed to open portal", error);
    return { ok: false, error: "Could not open the billing portal. Try again in a moment." };
  }
}
