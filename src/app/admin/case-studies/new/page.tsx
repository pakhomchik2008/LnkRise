import Link from "next/link";
import { CaseStudyForm } from "@/components/admin/case-study-form";

export default function NewCaseStudyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/case-studies" className="text-xs text-white/50 hover:text-white">
          ← Case studies
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">New case study</h1>
      </div>

      <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] p-5">
        <CaseStudyForm />
      </div>
    </div>
  );
}
