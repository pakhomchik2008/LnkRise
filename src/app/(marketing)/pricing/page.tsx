import type { Metadata } from "next";
import { Faq } from "@/components/landing/faq";
import { PricingCards } from "@/components/landing/pricing-cards";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Three days free, a fifteen-day pass for $9, or $19 a month for the full coach. No card to start.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <>
      <section className="px-5 pb-8 pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Pick the amount of coaching you want
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
            Start free for three days. If the plan is not better than what you would have done on
            your own, walk away — nothing is charged and nothing is deleted.
          </p>
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="mx-auto max-w-6xl">
          <PricingCards />
          <p className="mt-8 text-center text-xs text-ink-muted">
            Prices in USD. The 15-day pass is a single payment, not a subscription — it will not
            renew on its own.
          </p>
        </div>
      </section>

      <Faq />
    </>
  );
}
