import type { Metadata } from "next";
import { ComingNext } from "@/components/shared/coming-next";

export const metadata: Metadata = {
  title: "Content",
  robots: { index: false, follow: false },
};

export default function ContentPage() {
  return (
    <ComingNext
      title="Content"
      description="Your drafts, scheduled posts and the AI writing workspace."
      phase="the content phase"
    />
  );
}
