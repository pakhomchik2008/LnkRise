import type {
  CommentSuggestion,
  DailyBriefContent,
  EngagementScore,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/types";
import type { NamedInspiration } from "@/lib/linkedin/inspirations";

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

/**
 * Replaces the leading comment targets with named people — the inspirations
 * the user gave during onboarding — instead of a topic category. Pro-tier
 * only, gated by the caller on PLAN_ACCESS.commentCoaching, so trial users
 * keep the category-only brief.
 *
 * `person` is attached here, after generation, and never inside a prompt.
 * A model asked to name someone real has no way to know whether that account
 * posted anything today and would invent the detail confidently — this keeps
 * the claim to what we actually know, which is a URL the user supplied.
 *
 * This module stays free of the AI provider imports on purpose: it is pure,
 * so it can be exercised from a plain script and imported from anywhere.
 */
export function attachRealPeopleToComments(
  suggestions: CommentSuggestion[],
  inspirations: NamedInspiration[],
): CommentSuggestion[] {
  if (inspirations.length === 0) return suggestions;

  return suggestions.map((item, index) => {
    const person = inspirations[index];
    if (!person) return item;

    return {
      ...item,
      topic: `${person.name}’s recent posts`,
      why: `You told us ${person.name} is one of the people whose work you follow. A real comment from you carries more weight with them than with a stranger.`,
      person,
    };
  });
}

/** Brief-level wrapper over {@link attachRealPeopleToComments}. */
export function attachRealPeople(
  brief: DailyBriefContent,
  inspirations: NamedInspiration[],
): DailyBriefContent {
  if (inspirations.length === 0) return brief;
  return { ...brief, commentOn: attachRealPeopleToComments(brief.commentOn, inspirations) };
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
 * Grades yesterday, for the line at the top of today's brief.
 *
 * Ticking boxes is self-reported and unfalsifiable — someone can complete
 * every task and reach nobody. So a score built only from task completion is
 * a measure of effort, not of result, and this deliberately refuses to
 * present it as the latter: without platform numbers behind it the result is
 * `unverified`, which the UI renders as a warning rather than a score.
 *
 * When impressions for both days are known, the delta between them carries
 * 40% of the weight. That is the only part of this number that reflects
 * anything the outside world did.
 */
export function engagementScore(input: {
  tasksDone: number;
  tasksTotal: number;
  impressionsYesterday?: number | null;
  impressionsDayBefore?: number | null;
  measuredOn?: string | null;
}): EngagementScore {
  const { tasksDone, tasksTotal } = input;
  if (tasksTotal === 0) return { kind: "idle" };

  const completion = tasksDone / tasksTotal;
  const { impressionsYesterday, impressionsDayBefore, measuredOn } = input;

  const hasBothDays =
    typeof impressionsYesterday === "number" &&
    typeof impressionsDayBefore === "number" &&
    measuredOn != null;

  if (!hasBothDays) {
    return {
      kind: "unverified",
      score: Math.round(completion * 100),
      tasksDone,
      tasksTotal,
    };
  }

  const delta = impressionsYesterday - impressionsDayBefore;

  // A flat day scores 50 on the reach half, not 0 — posting into a quiet day
  // is not a failure. ±40% movement is treated as the full range; beyond that
  // the number stops discriminating usefully.
  const ratio = impressionsDayBefore > 0 ? delta / impressionsDayBefore : delta > 0 ? 0.4 : 0;
  const reach = Math.max(0, Math.min(1, 0.5 + ratio / 0.8));

  return {
    kind: "measured",
    score: Math.round((completion * 0.6 + reach * 0.4) * 100),
    tasksDone,
    tasksTotal,
    impressionsDelta: delta,
    measuredOn,
  };
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
