"use client";

import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom";
  className?: string;
  panelClassName?: string;
}

export function Dropdown({
  trigger,
  children,
  align = "start",
  side = "bottom",
  className,
  panelClassName,
}: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="w-full text-left"
      >
        {trigger}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: side === "bottom" ? -6 : 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: side === "bottom" ? -6 : 6,
              scale: 0.97,
              transition: { duration: 0.15, ease: [0.55, 0.06, 0.68, 0.19] },
            }}
            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => setOpen(false)}
            className={cn(
              "absolute z-50 min-w-[12rem] overflow-hidden rounded-[var(--radius-md)]",
              "border border-hairline bg-surface p-1 shadow-[var(--shadow-lg)]",
              side === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
              align === "end" ? "right-0" : "left-0",
              panelClassName,
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({
  className,
  icon,
  destructive,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & { icon?: React.ReactNode; destructive?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm",
        "transition-colors duration-150",
        destructive
          ? "text-red-600 hover:bg-red-50"
          : "text-ink hover:bg-ink/[0.05]",
        className,
      )}
      {...props}
    >
      {icon && <span aria-hidden className="shrink-0 text-ink-muted">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="my-1 h-px bg-hairline" />;
}
