import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * The only place subscription state actually changes. Checkout and the
 * billing portal only ever redirect to Stripe — this is what Stripe calls
 * back into once money has actually moved, so it's the source of truth for
 * `Subscription.plan`/`status`/`currentPeriodEnd`.
 */
export async function POST(request: Request): Promise<Response> {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "not configured" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = (await headers()).get("stripe-signature");
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe webhook] signature verification failed", error);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;
      if (!userId) break;

      if (planId === "starter") {
        // One-time 15-day pass — Stripe has no subscription object for this,
        // so the expiry is stamped here rather than read back from Stripe.
        await prisma.subscription.upsert({
          where: { userId },
          update: {
            plan: "starter",
            status: "active",
            currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          },
          create: {
            userId,
            plan: "starter",
            status: "active",
            currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          },
        });
      } else if (planId === "pro" && typeof session.subscription === "string") {
        const subscription = await stripe().subscriptions.retrieve(session.subscription);
        await syncProSubscription(userId, subscription);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId ?? (await userIdForCustomer(subscription.customer));
      if (userId) await syncProSubscription(userId, subscription);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function syncProSubscription(userId: string, subscription: Stripe.Subscription): Promise<void> {
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const lapsed = subscription.status === "canceled" || subscription.status === "unpaid";

  const data = {
    plan: lapsed ? "trial" : "pro",
    status: subscription.status,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  };

  await prisma.subscription.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

async function userIdForCustomer(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): Promise<string | null> {
  const customerId = typeof customer === "string" ? customer : customer?.id;
  if (!customerId) return null;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    select: { userId: true },
  });
  return subscription?.userId ?? null;
}
