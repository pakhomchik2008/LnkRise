import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStudyForm } from "@/components/admin/case-study-form";
import { fromJson, prisma } from "@/lib/prisma";

interface Stats {
  profileViews: number;
  followers: number;
  postImpressions: number;
}

export default async function EditCaseStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const study = await prisma.caseStudy.findUnique({ where: { id } });
  if (!study) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/case-studies" className="text-xs text-white/50 hover:text-white">
            ← Case studies
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Edit case study</h1>
        </div>
        {study.published && (
          <Link
            href={`/case-studies/${study.slug}`}
            target="_blank"
            className="text-xs text-white/60 hover:text-white"
          >
            View live →
          </Link>
        )}
      </div>

      <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] p-5">
        <CaseStudyForm
          initial={{
            id: study.id,
            slug: study.slug,
            title: study.title,
            userName: study.userName,
            userImage: study.userImage ?? "",
            userRole: study.userRole ?? "",
            story: study.story,
            testimonial: study.testimonial ?? "",
            published: study.published,
            beforeStats: fromJson<Stats>(study.beforeStats) ?? { profileViews: 0, followers: 0, postImpressions: 0 },
            afterStats: fromJson<Stats>(study.afterStats) ?? { profileViews: 0, followers: 0, postImpressions: 0 },
          }}
        />
      </div>
    </div>
  );
}
