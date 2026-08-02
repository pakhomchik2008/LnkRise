import type { DailyBriefContent, TaskPriority, TaskType } from "@/types";

export interface NewTask {
  type: TaskType;
  title: string;
  description: string;
  priority: TaskPriority;
  aiData?: Record<string, unknown>;
}

/**
 * A brief is content; tasks are the trackable version of it. One place builds
 * them so the dashboard, the brief page and the cron job cannot drift apart.
 */
export function tasksFromBrief(brief: DailyBriefContent): NewTask[] {
  const tasks: NewTask[] = [
    {
      type: "post",
      title: `Publish: ${brief.postIdea.topic}`,
      description: brief.postIdea.why,
      priority: "high",
      aiData: { hook: brief.postIdea.hook, draft: brief.postIdea.draft, cta: brief.postIdea.cta },
    },
  ];

  brief.connectWith.slice(0, 2).forEach((connect) => {
    tasks.push({
      type: "connect",
      title: `Reach out: ${connect.audience}`,
      description: connect.why,
      priority: "medium",
      aiData: { message: connect.message, searchQuery: connect.searchQuery },
    });
  });

  brief.commentOn.slice(0, 2).forEach((comment) => {
    tasks.push({
      type: "comment",
      title: `Join the conversation: ${comment.topic}`,
      description: comment.why,
      priority: "medium",
      aiData: { starters: comment.starters, timeEstimate: comment.timeEstimate },
    });
  });

  tasks.push({
    type: "optimize",
    title: brief.optimizationTip.title,
    description: brief.optimizationTip.detail,
    priority: "low",
  });

  return tasks;
}

/**
 * Growth score, Phase 1 shape: profile quality contributes a fixed base and
 * completed work moves the rest. The weighted version arrives with analytics.
 */
export function computeGrowthScore(input: {
  profileScore: number;
  tasksCompleted: number;
  tasksTotal: number;
  streak: number;
}): number {
  const profile = Math.round(input.profileScore * 0.35);
  const completion =
    input.tasksTotal === 0 ? 0 : Math.round((input.tasksCompleted / input.tasksTotal) * 35);
  const consistency = Math.min(30, input.streak * 3);

  return Math.max(0, Math.min(100, profile + completion + consistency));
}
