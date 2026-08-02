"use client";

import { CommentCard, ConnectCard, PostDraftCard } from "./brief-cards";
import type { PublishConfig } from "./publish-dialog";
import type { DailyBriefContent } from "@/types";

export function BriefCards({
  content,
  publish,
}: {
  content: DailyBriefContent;
  publish?: PublishConfig;
}) {
  return (
    <div className="space-y-5">
      <PostDraftCard post={content.postIdea} publish={publish} />
      <ConnectCard items={content.connectWith} />
      <CommentCard items={content.commentOn} />
    </div>
  );
}
