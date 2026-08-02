"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "lucide-react";
import * as React from "react";
import { markDayComplete } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { pluralize } from "@/lib/utils";

/** Twelve dots flung outward once, then gone — no library, no loop. */
function Celebration() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 12 }).map((_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        return (
          <motion.span
            key={index}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos(angle) * 90,
              y: Math.sin(angle) * 90,
              scale: 0.4,
            }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute left-1/2 top-1/2 size-1.5 rounded-full [background:var(--gradient-accent)]"
          />
        );
      })}
    </div>
  );
}

export function DayComplete({
  streak,
  alreadyComplete,
  hasBrief,
}: {
  streak: number;
  alreadyComplete: boolean;
  hasBrief: boolean;
}) {
  const { toast } = useToast();
  const [done, setDone] = React.useState(alreadyComplete);
  const [pending, setPending] = React.useState(false);
  const [celebrating, setCelebrating] = React.useState(false);
  const [current, setCurrent] = React.useState(streak);

  async function onClick() {
    setPending(true);
    const result = await markDayComplete();
    setPending(false);

    if ("error" in result && !result.ok) {
      toast({ tone: "error", title: result.error });
      return;
    }

    setDone(true);
    setCelebrating(true);
    if ("streak" in result) setCurrent(result.streak);
    window.setTimeout(() => setCelebrating(false), 800);
    toast({ tone: "success", title: "Day banked", description: "See you tomorrow morning." });
  }

  return (
    <Card className="relative overflow-hidden">
      <AnimatePresence>{celebrating && <Celebration />}</AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-accent-orange/12 text-orange-600">
            <Flame aria-hidden className="size-5" />
          </span>
          <div>
            <p className="font-mono text-xl font-bold tabular-nums text-ink">
              {current} {pluralize(current, "day", "days")}
            </p>
            <p className="text-xs text-ink-muted">
              {current === 0
                ? "Start the streak today"
                : done
                  ? "Banked. Come back tomorrow."
                  : "Keep it alive"}
            </p>
          </div>
        </div>

        <Button onClick={onClick} loading={pending} disabled={done || !hasBrief}>
          {done ? "Day complete" : "Mark day complete"}
        </Button>
      </div>
    </Card>
  );
}
