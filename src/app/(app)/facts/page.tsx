import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FactBank } from "@/components/facts/fact-bank";
import { requireUserId } from "@/lib/auth";
import { allQuestions } from "@/lib/facts";
import { prisma } from "@/lib/prisma";
import type { OnboardingAnswers, UserFact } from "@/types";

export const metadata: Metadata = {
  title: "Your material",
  robots: { index: false, follow: false },
};

export default async function FactsPage() {
  const userId = await requireUserId();

  const [user, facts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { onboardedAt: true, onboardingData: true },
    }),
    prisma.fact.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, question: true, body: true, kind: true },
    }),
  ]);

  if (!user?.onboardedAt) redirect("/onboarding");

  const answers = user.onboardingData as unknown as OnboardingAnswers | null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-ink">Your material</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
          The specific things you have done. Everything written for you is built from this — without
          it a draft can only be about your industry in general, which is the same draft everyone
          else in your industry would get.
        </p>
      </header>

      <FactBank
        facts={facts as UserFact[]}
        questions={answers ? allQuestions(answers.goal, answers.industry) : []}
      />
    </div>
  );
}
