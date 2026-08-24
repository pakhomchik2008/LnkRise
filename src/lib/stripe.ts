import "server-only";
import Stripe from "stripe";

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;

/** Throws if called without STRIPE_SECRET_KEY set — check `stripeEnabled()` first. */
export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}

/**
 * Price IDs live in env rather than `constants.ts` because they differ per
 * Stripe account (test vs live, and a buyer's own account after resale) —
 * unlike the dollar amounts shown in the UI, which are just copy.
 */
export const STRIPE_PRICE_IDS: Partial<Record<"starter" | "pro", string>> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
};

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
