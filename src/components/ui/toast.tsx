"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (input: Omit<ToastItem, "id"> | string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}

const ICONS: Record<ToastTone, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ACCENTS: Record<ToastTone, string> = {
  success: "text-accent-green",
  error: "text-red-500",
  info: "text-brand-500",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = React.useCallback(
    (input: Omit<ToastItem, "id"> | string) => {
      const item: ToastItem =
        typeof input === "string"
          ? { id: crypto.randomUUID(), title: input, tone: "info" }
          : { id: crypto.randomUUID(), ...input };

      setItems((current) => [...current, item]);
      window.setTimeout(() => dismiss(item.id), 4500);
    },
    [dismiss],
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const Icon = ICONS[item.tone];
            return (
              <motion.div
                key={item.id}
                layout
                role="status"
                initial={{ opacity: 0, x: 32, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  x: 32,
                  scale: 0.96,
                  transition: { duration: 0.2, ease: [0.55, 0.06, 0.68, 0.19] },
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 rounded-[var(--radius-md)]",
                  "border border-hairline bg-surface p-3.5 shadow-[var(--shadow-lg)]",
                )}
              >
                <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", ACCENTS[item.tone])} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-ink-muted">{item.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="rounded p-0.5 text-ink-muted transition-colors hover:text-ink"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
