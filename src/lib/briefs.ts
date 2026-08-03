import type { DailyBriefContent, TaskPriority, TaskStatus, TaskType } from "@/types";

export interface NewTask {
  type: TaskType;
  title: string;
  description: string;
  priority: TaskPriority;
  aiData?: Record<string, unknown>;
}

/**
 * A brief is content; tasks are the trackable version of it. One task per
 * card item — every person to reach out to and every conversation to join
 * gets its own row, not just the first two of each. That is what lets each
 * card render its own "done" checkbox instead of a separate duplicate list.
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

  brief.connectWith.forEach((connect) => {
    tasks.push({
      type: "connect",
      title: `Reach out: ${connect.audience}`,
      description: connect.why,
      priority: "medium",
      aiData: { message: connect.message, searchQuery: connect.searchQuery },
    });
  });

  brief.commentOn.forEach((comment) => {
    tasks.push({
      type: "comment",
      title: `Comment: ${comment.topic}`,
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

export interface TaskRef {
  id: string;
  done: boolean;
}

export interface BriefTaskGroups {
  post?: TaskRef;
  connect: TaskRef[];
  comment: TaskRef[];
  optimize?: TaskRef;
}

/**
 * Maps flat CoachingTask rows back onto the brief's cards, one row per card
 * item. Tasks for the same brief are inserted in the same order the content
 * arrays are built in (see tasksFromBrief above), and cuid ids are
 * K-sortable — lexical id order reconstructs insertion order reliably, even
 * when every row in a batch shares one createMany timestamp.
 */
export function groupTasksByType(
  tasks: { id: string; type: TaskType; status: TaskStatus }[],
): BriefTaskGroups {
  const sorted = [...tasks].sort((a, b) => a.id.localeCompare(b.id));
  const byType = (type: TaskType): TaskRef[] =>
    sorted
      .filter((task) => task.type === type)
      .map((task) => ({ id: task.id, done: task.status === "completed" }));

  return {
    post: byType("post")[0],
    connect: byType("connect"),
    comment: byType("comment"),
    optimize: byType("optimize")[0],
  };
}

export function briefProgress(groups: BriefTaskGroups): { done: number; total: number } {
  const all = [groups.post, ...groups.connect, ...groups.comment, groups.optimize].filter(
    (task): task is TaskRef => Boolean(task),
  );
  return { done: all.filter((task) => task.done).length, total: all.length };
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
