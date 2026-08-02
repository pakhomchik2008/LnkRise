import type { Metadata } from "next";
import { ComingNext } from "@/components/shared/coming-next";

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

export default function BillingPage() {
  return (
    <ComingNext
      title="Billing"
      description="Your plan, invoices and upgrades."
      phase="the billing phase"
    />
  );
}
