import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Case studies",
  description: "How real accounts moved after a month of daily coaching.",
  alternates: { canonical: "/case-studies" },
};

export const dynamic = "force-dynamic";

export default async function CaseStudiesPage() {
  const studies = await prisma.caseStudy.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: { slug: true, title: true, userName: true, userImage: true, userRole: true },
  });

  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">Case studies</h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          What actually changed, told by the people it changed for — before and after numbers included.
        </p>

        {studies.length === 0 ? (
          <EmptyState
            className="mt-12"
            title="Nothing published yet"
            description="Case studies go live here once the first ones are written up."
          />
        ) : (
          <div className="mt-12 space-y-4">
            {studies.map((study) => (
              <article
                key={study.slug}
                className="relative flex items-center gap-4 rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 transition-shadow duration-300 hover:shadow-[var(--shadow-md)]"
              >
                <Avatar name={study.userName} email={study.userName} src={study.userImage} size="md" />
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold leading-snug text-ink">
                    <Link href={`/case-studies/${study.slug}`} className="after:absolute after:inset-0">
                      {study.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {study.userName}
                    {study.userRole ? ` · ${study.userRole}` : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
