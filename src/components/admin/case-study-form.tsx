"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useActionState } from "react";
import {
  createCaseStudy,
  deleteCaseStudy,
  updateCaseStudy,
} from "@/app/admin/case-studies/actions";

interface Stats {
  profileViews: number;
  followers: number;
  postImpressions: number;
}

type Initial = {
  id?: string;
  slug: string;
  title: string;
  userName: string;
  userImage: string;
  userRole: string;
  story: string;
  testimonial: string;
  published: boolean;
  beforeStats: Stats;
  afterStats: Stats;
};

const emptyStats: Stats = { profileViews: 0, followers: 0, postImpressions: 0 };
const empty: Initial = {
  slug: "",
  title: "",
  userName: "",
  userImage: "",
  userRole: "",
  story: "",
  testimonial: "",
  published: false,
  beforeStats: emptyStats,
  afterStats: emptyStats,
};

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none";
const labelClass = "text-xs uppercase tracking-wide text-white/50";

function StatsFields({ prefix, defaults }: { prefix: "before" | "after"; defaults: Stats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block">
        <span className={labelClass}>Profile views</span>
        <input
          type="number"
          min={0}
          name={`${prefix}ProfileViews`}
          defaultValue={defaults.profileViews}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Followers</span>
        <input
          type="number"
          min={0}
          name={`${prefix}Followers`}
          defaultValue={defaults.followers}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Post impressions</span>
        <input
          type="number"
          min={0}
          name={`${prefix}PostImpressions`}
          defaultValue={defaults.postImpressions}
          className={fieldClass}
        />
      </label>
    </div>
  );
}

export function CaseStudyForm({ initial }: { initial?: Initial }) {
  const data = initial ?? empty;
  const isEdit = Boolean(data.id);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [state, action, submitting] = useActionState(
    async (_: { error: string | null }, formData: FormData) => {
      const result = isEdit && data.id
        ? await updateCaseStudy(data.id, formData)
        : await createCaseStudy(formData);

      if (!result.ok) return { error: result.error ?? "Failed" };

      if (!isEdit && "id" in result && result.id) {
        router.push(`/admin/case-studies/${result.id}`);
      } else {
        router.refresh();
      }
      return { error: null };
    },
    { error: null },
  );

  function onDelete() {
    if (!data.id) return;
    if (!confirm("Delete this case study? Cannot be undone.")) return;
    startTransition(async () => {
      await deleteCaseStudy(data.id!);
      router.push("/admin/case-studies");
    });
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Title</span>
          <input name="title" defaultValue={data.title} required maxLength={180} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Slug</span>
          <input
            name="slug"
            defaultValue={data.slug}
            required
            pattern="[a-z0-9-]+"
            className={`${fieldClass} font-mono`}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Person&apos;s name</span>
          <input name="userName" defaultValue={data.userName} required maxLength={120} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Role</span>
          <input name="userRole" defaultValue={data.userRole} maxLength={120} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Photo URL</span>
          <input name="userImage" type="url" defaultValue={data.userImage} className={fieldClass} />
        </label>
      </div>

      <fieldset className="rounded-[var(--radius-sm)] border border-white/10 p-3">
        <legend className={labelClass}>Before</legend>
        <StatsFields prefix="before" defaults={data.beforeStats} />
      </fieldset>

      <fieldset className="rounded-[var(--radius-sm)] border border-white/10 p-3">
        <legend className={labelClass}>After</legend>
        <StatsFields prefix="after" defaults={data.afterStats} />
      </fieldset>

      <label className="block">
        <span className={labelClass}>Story</span>
        <textarea
          name="story"
          defaultValue={data.story}
          required
          rows={10}
          className={`${fieldClass} leading-relaxed`}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Testimonial quote (optional)</span>
        <textarea name="testimonial" defaultValue={data.testimonial} rows={3} className={fieldClass} />
      </label>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" name="published" defaultChecked={data.published} />
        <span className="text-sm text-white/80">Published</span>
      </label>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[var(--radius-sm)] bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white/90 disabled:opacity-50"
        >
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create case study"}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="rounded-[var(--radius-sm)] border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-40"
          >
            Delete case study
          </button>
        )}
      </div>
    </form>
  );
}
