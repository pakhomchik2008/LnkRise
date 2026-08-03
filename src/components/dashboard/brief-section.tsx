"use client";

import { CheckCircle2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { BriefTaskGroups } from "@/lib/briefs";
import { briefProgress } from "@/lib/briefs";
import type { DailyBriefContent } from "@/types";
import { CommentCard, ConnectCard, OptimizeCard, PostDraftCard } from "./brief-cards";
import type { PublishConfig } from "./publish-dialog";

export function BriefProgress({ tasks }: { tasks: BriefTaskGroups }) {
  const { done, total } = briefProgress(tasks);
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-hairline bg-surface px-4 py-3">
      <CheckCircle2 aria-hidden className="size-4 shrink-0 text-brand-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">
          {done} of {total} done today
        </p>
        <ProgressBar value={(done / total) * 100} size="sm" className="mt-1.5" />
      </div>
    </div>
  );
}

export function BriefCards({
  content,
  tasks,
  publish,
}: {
  content: DailyBriefContent;
  tasks: BriefTaskGroups;
  publish?: PublishConfig;
}) {
  return (
    <div className="space-y-5">
      <PostDraftCard post={content.postIdea} task={tasks.post} publish={publish} />
      <ConnectCard items={content.connectWith} tasks={tasks.connect} />
      <CommentCard items={content.commentOn} tasks={tasks.comment} />
      <OptimizeCard tip={content.optimizationTip} task={tasks.optimize} />
    </div>
  );
}
