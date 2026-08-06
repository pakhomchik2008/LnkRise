"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  TEMPLATE_CATEGORY_LABELS,
  type PostTemplate,
  type TemplateCategory,
} from "@/lib/content-templates";
import { cn } from "@/lib/utils";

const ENTRANCE = { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } as const;

export function TemplateLibrary({ templates }: { templates: PostTemplate[] }) {
  const router = useRouter();
  const [category, setCategory] = React.useState<TemplateCategory | "all">("all");
  const [open, setOpen] = React.useState<PostTemplate | null>(null);

  const categories = React.useMemo(() => {
    const present = new Set(templates.map((template) => template.category));
    return [...present];
  }, [templates]);

  const visible =
    category === "all" ? templates : templates.filter((template) => template.category === category);

  function startFrom(template: PostTemplate) {
    // The skeleton goes into the editor as the starting text — the shape is
    // the point, and a blank page is what people get stuck on.
    router.push(`/content/editor?draft=${encodeURIComponent(template.skeleton)}`);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1">
        <button
          onClick={() => setCategory("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150",
            category === "all"
              ? "bg-ink/[0.07] text-ink"
              : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink",
          )}
        >
          All
        </button>
        {categories.map((entry) => (
          <button
            key={entry}
            onClick={() => setCategory(entry)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150",
              category === entry
                ? "bg-ink/[0.07] text-ink"
                : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink",
            )}
          >
            {TEMPLATE_CATEGORY_LABELS[entry]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((template, index) => {
          // Premium templates arrive from the server with their body stripped,
          // so an empty skeleton is what "locked" looks like here.
          const locked = template.premium && template.skeleton.length === 0;

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...ENTRANCE, delay: Math.min(index, 9) * 0.04 }}
            >
              <Card className={cn("flex h-full flex-col", locked && "border-dashed")}>
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <p className={cn("text-sm font-semibold", locked ? "text-ink-muted" : "text-ink")}>
                    {template.name}
                  </p>
                  {locked ? (
                    <Badge tone="premium">
                      <Lock aria-hidden className="mr-1 inline size-3" />
                      Pro
                    </Badge>
                  ) : (
                    <Badge tone="neutral">{TEMPLATE_CATEGORY_LABELS[template.category]}</Badge>
                  )}
                </div>

                <p className="flex-1 text-xs leading-relaxed text-ink-muted">
                  {locked
                    ? "The structure and worked example for this one are part of Pro."
                    : template.structure[0]}
                </p>

                <div className="mt-3">
                  {locked ? (
                    <Button variant="secondary" size="sm" onClick={() => router.push("/billing")}>
                      See Pro
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setOpen(template)}>
                      Look inside
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.name ?? ""}
        description={open ? TEMPLATE_CATEGORY_LABELS[open.category] : ""}
      >
        {open && (
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink-muted">THE SHAPE</p>
              <ol className="space-y-1">
                {open.structure.map((step, index) => (
                  <li key={index} className="flex gap-2 text-sm leading-relaxed text-ink">
                    <span className="font-mono text-xs text-ink-muted">{index + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink-muted">FILLED IN</p>
              <p className="whitespace-pre-wrap rounded-[var(--radius-sm)] border border-hairline bg-surface-muted/50 p-3 text-sm leading-relaxed text-ink">
                {open.example}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(null)}>
                Close
              </Button>
              <Button onClick={() => startFrom(open)}>Start from this</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
