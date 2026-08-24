"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { syncMemberAnalytics, type SyncOutcome } from "@/lib/linkedin/sync";

export async function syncLinkedInAnalytics(): Promise<SyncOutcome> {
  const userId = await requireUserId();
  const outcome = await syncMemberAnalytics(userId);

  if (outcome.ok) revalidatePath("/analytics");
  return outcome;
}
