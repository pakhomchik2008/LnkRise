import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminCaseStudiesPage() {
  const studies = await prisma.caseStudy.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, userName: true, published: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Case studies</h1>
          <p className="mt-1 text-sm text-white/60">
            {studies.length} case stud{studies.length === 1 ? "y" : "ies"}. Draft ones are not visible publicly.
          </p>
        </div>
        <Link
          href="/admin/case-studies/new"
          className="rounded-[var(--radius-sm)] bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white/90"
        >
          New case study
        </Link>
      </header>

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Person</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {studies.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link href={`/admin/case-studies/${s.id}`} className="font-medium text-white hover:underline">
                    {s.title}
                  </Link>
                  <p className="truncate text-xs text-white/50">/{s.slug}</p>
                </td>
                <td className="px-4 py-3 text-xs text-white/60">{s.userName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      s.published ? "bg-accent-green/20 text-emerald-300" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {s.published ? "published" : "draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-white/60">{s.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
            {studies.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-white/50">
                  No case studies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
