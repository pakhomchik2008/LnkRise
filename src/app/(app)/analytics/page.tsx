import type { Metadata } from "next";
import { ComingNext } from "@/components/shared/coming-next";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default function AnalyticsPage() {
  return (
    <ComingNext
      title="Analytics"
      description="Charts, best posting times and the weekly read on what moved."
      phase="the analytics phase"
    />
  );
}
