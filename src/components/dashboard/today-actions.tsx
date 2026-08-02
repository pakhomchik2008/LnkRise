"use client";

import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { toggleTask } from "@/app/(app)/dashboard/actions";
import { ActionCard } from "@/components/ui/action-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/components/ui/toast";
import type { CoachingTaskView } from "@/types";

export function TodayActions({ tasks }: { tasks: CoachingTaskView[] }) {
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [optimistic, setOptimistic] = React.useOptimistic(
    tasks,
    (current: CoachingTaskView[], taskId: string) =>
      current.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === "completed" ? "pending" : "completed" }
          : task,
      ),
  );

  const completed = optimistic.filter((task) => task.status === "completed").length;
  const allDone = optimistic.length > 0 && completed === optimistic.length;

  function onToggle(taskId: string) {
    startTransition(async () => {
      setOptimistic(taskId);
      const result = await toggleTask(taskId);
      if (!result.ok) toast({ tone: "error", title: result.error });
    });
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Today&rsquo;s actions</CardTitle>
          <CardDescription>
            {optimistic.length === 0
              ? "Nothing scheduled"
              : `${completed} of ${optimistic.length} done`}
          </CardDescription>
        </div>
      </CardHeader>

      {optimistic.length > 0 && (
        <ProgressBar
          value={(completed / optimistic.length) * 100}
          size="sm"
          className="mb-4"
          label="Progress"
        />
      )}

      {optimistic.length === 0 ? (
        <EmptyState
          title="No actions yet"
          description="Your first brief is generated when you finish onboarding. After that, a new one lands each morning."
        />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {optimistic.map((task, index) => (
              <ActionCard
                key={task.id}
                index={index}
                title={task.title}
                description={task.description}
                type={task.type}
                priority={task.priority}
                completed={task.status === "completed"}
                pending={pending}
                onToggle={() => onToggle(task.id)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {allDone && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-[var(--radius-sm)] bg-accent-green/10 px-3 py-2.5 text-sm font-medium text-emerald-700"
          >
            Everything done. Mark the day complete below to bank the streak.
          </motion.p>
        )}
      </AnimatePresence>
    </Card>
  );
}
