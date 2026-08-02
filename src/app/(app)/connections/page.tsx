import type { Metadata } from "next";
import { ComingNext } from "@/components/shared/coming-next";

export const metadata: Metadata = {
  title: "Connections",
  robots: { index: false, follow: false },
};

export default function ConnectionsPage() {
  return (
    <ComingNext
      title="Connections"
      description="Outreach categories, saved searches and message templates in one place."
      phase="the strategy phase"
    />
  );
}
