"use client";

import { CommentCard, ConnectCard, PostDraftCard } from "./brief-cards";
import type { DailyBriefContent } from "@/types";

export function BriefCards({ content }: { content: DailyBriefContent }) {
  return (
    <div className="space-y-5">
      <PostDraftCard post={content.postIdea} />
      <ConnectCard items={content.connectWith} />
      <CommentCard items={content.commentOn} />
    </div>
  );
}
