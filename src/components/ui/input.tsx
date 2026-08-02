"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.ComponentPropsWithoutRef<"input">, "ref"> {
  label: string;
  error?: string | null;
  success?: string | null;
  hint?: string;
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, success, hint, trailing, id, value, defaultValue, ...props },
  ref,
) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const [focused, setFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(
    Boolean(value ?? defaultValue ?? props.placeholder),
  );

  const floating = focused || hasValue;
  const describedBy = error ? `${inputId}-error` : success ? `${inputId}-success` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative rounded-[var(--radius-sm)] border bg-surface transition-colors duration-150",
          error
            ? "border-red-500"
            : success
              ? "border-accent-green"
              : focused
                ? "border-brand-500"
                : "border-hairline",
        )}
      >
        <motion.label
          htmlFor={inputId}
          initial={false}
          animate={{
            top: floating ? 6 : 15,
            fontSize: floating ? 11 : 14,
            color: error
              ? "#dc2626"
              : focused
                ? "var(--color-brand-600)"
                : "var(--color-ink-muted)",
          }}
          transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="pointer-events-none absolute left-3 origin-left font-medium"
        >
          {label}
        </motion.label>

        <input
          ref={ref}
          id={inputId}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            setHasValue(event.target.value.length > 0);
            props.onBlur?.(event);
          }}
          onChange={(event) => {
            setHasValue(event.target.value.length > 0);
            props.onChange?.(event);
          }}
          {...props}
          className={cn(
            "h-14 w-full rounded-[var(--radius-sm)] bg-transparent px-3 pt-5 pb-1.5 text-sm text-ink",
            "outline-none placeholder:text-ink-muted/60",
            trailing && "pr-11",
          )}
        />

        {trailing && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {(error || success || hint) && (
          <motion.p
            key={error ?? success ?? hint}
            id={describedBy}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role={error ? "alert" : undefined}
            className={cn(
              "mt-1.5 flex items-center gap-1.5 text-xs",
              error ? "text-red-600" : success ? "text-accent-green" : "text-ink-muted",
            )}
          >
            {error && <AlertCircle aria-hidden className="size-3.5 shrink-0" />}
            {!error && success && <Check aria-hidden className="size-3.5 shrink-0" />}
            {error ?? success ?? hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});
