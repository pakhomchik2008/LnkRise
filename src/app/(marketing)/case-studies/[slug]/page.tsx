import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { fromJson, prisma } from "@/lib/prisma";

interface Stats {
  profileViews: number;
  followers: number;
  postImpressions: number;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

async function getStudy(slug: string) {
  return prisma.caseStudy.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = await getStudy(slug);

  if (!study) return { title: "Case study not found" };

  return {
    title: study.title,
    alternates: { canonical: `/case-studies/${study.slug}` },
  };
}

function pctChange(before: number, after: number): string {
  if (before <= 0) return after > 0 ? "new" : "—";
  const delta = ((after - before) / before) * 100;
  return `${delta >= 0 ? "+" : ""}${Math.round(delta)}%`;
}

function StatRow({ label, before, after }: { label: string; before: number; after: number }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline py-3 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <div className="flex items-center gap-3 font-mono text-sm">
        <span className="text-ink-muted">{before.toLocaleString()}</span>
        <ArrowUp aria-hidden className="size-3.5 text-accent-green" />
        <span className="font-semibold text-ink">{after.toLocaleString()}</span>
        <span className="text-xs text-accent-green">{pctChange(before, after)}</span>
      </div>
    </div>
  );
}

export default async function CaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const study = await getStudy(slug);

  if (!study) notFound();

  const before = fromJson<Stats>(study.beforeStats) ?? { profileViews: 0, followers: 0, postImpressions: 0 };
  const after = fromJson<Stats>(study.afterStats) ?? { profileViews: 0, followers: 0, postImpressions: 0 };
  const paragraphs = study.story.split("\n\n").filter(Boolean);

  return (
    <article className="px-5 py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/case-studies"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" />
          All case studies
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <Avatar name={study.userName} email={study.userName} src={study.userImage} size="lg" />
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
              {study.title}
            </h1>
            <p className="text-sm text-ink-muted">
              {study.userName}
              {study.userRole ? ` · ${study.userRole}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[var(--radius-lg)] border border-hairline bg-surface p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Before → after</h2>
          <div className="mt-2">
            <StatRow label="Profile views" before={before.profileViews} after={after.profileViews} />
            <StatRow label="Followers" before={before.followers} after={after.followers} />
            <StatRow label="Post impressions" before={before.postImpressions} after={after.postImpressions} />
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-base leading-relaxed text-ink">
              {paragraph}
            </p>
          ))}
        </div>

        {study.testimonial && (
          <blockquote className="mt-8 border-l-2 border-brand-500 pl-5 text-lg italic leading-relaxed text-ink">
            &ldquo;{study.testimonial}&rdquo;
          </blockquote>
        )}
      </div>
    </article>
  );
}
