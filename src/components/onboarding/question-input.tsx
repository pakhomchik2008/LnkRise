"use client";

import { motion } from "framer-motion";
import { ArrowRight, Plus, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OnboardingStep } from "@/lib/onboarding-flow";
import { cn, parseLinkedInUrl } from "@/lib/utils";
import type { ManualProfileDraft } from "@/types";

export interface QuestionInputProps {
  step: OnboardingStep;
  onAnswer: (value: string | string[] | ManualProfileDraft) => void;
}

const ENTRANCE = { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } as const;

function Chips({ step, onAnswer }: QuestionInputProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {step.options?.map((option, index) => (
        <motion.button
          key={option.value}
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...ENTRANCE, delay: index * 0.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onAnswer(option.value)}
          className={cn(
            "rounded-[var(--radius-md)] border border-hairline bg-surface px-4 py-2.5 text-left",
            "transition-colors duration-150 hover:border-brand-400 hover:bg-brand-50/50",
          )}
        >
          <span className="block text-sm font-medium text-ink">{option.label}</span>
          {option.blurb && <span className="mt-0.5 block text-xs text-ink-muted">{option.blurb}</span>}
        </motion.button>
      ))}
    </div>
  );
}

function FreeText({ step, onAnswer }: QuestionInputProps) {
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const suggestions = step.suggestions?.filter(
    (suggestion) =>
      value.length > 0 &&
      suggestion.toLowerCase().includes(value.toLowerCase()) &&
      suggestion.toLowerCase() !== value.toLowerCase(),
  );

  function submit(next = value) {
    const trimmed = next.trim();
    if (trimmed.length < 2 && !step.optional) {
      setError("A few more words would help.");
      return;
    }
    onAnswer(trimmed);
  }

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex items-start gap-2"
      >
        <Input
          label={step.placeholder ?? "Your answer"}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          error={error}
          hint={step.hint}
          autoFocus
        />
        <Button type="submit" size="lg" className="shrink-0" aria-label="Send answer">
          <ArrowRight className="size-4" />
        </Button>
      </form>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.slice(0, 5).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submit(suggestion)}
              className="rounded-full border border-hairline bg-surface px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-brand-300 hover:text-ink"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UrlField({ step, onAnswer }: QuestionInputProps) {
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function submit() {
    if (!value.trim()) {
      if (step.optional) {
        onAnswer("");
        return;
      }
      setError("A profile URL is needed here.");
      return;
    }

    const parsed = parseLinkedInUrl(value);
    if (!parsed.valid) {
      setError("That does not look like a profile URL. It should contain /in/your-handle.");
      return;
    }

    onAnswer(parsed.normalized ?? value);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex items-start gap-2">
        <Input
          label="Profile URL"
          type="url"
          inputMode="url"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          error={error}
          hint={step.hint}
          placeholder={step.placeholder}
          autoFocus
        />
        <Button type="submit" size="lg" className="shrink-0" aria-label="Submit URL">
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {step.optional && (
        <button
          type="button"
          onClick={() => onAnswer("")}
          className="mt-2 text-xs font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Skip this
        </button>
      )}
    </form>
  );
}

function UrlList({ step, onAnswer }: QuestionInputProps) {
  const [fields, setFields] = React.useState<string[]>([""]);
  const [error, setError] = React.useState<string | null>(null);

  function update(index: number, next: string) {
    setFields((current) => current.map((item, position) => (position === index ? next : item)));
    setError(null);
  }

  function submit() {
    const filled = fields.map((field) => field.trim()).filter(Boolean);

    if (filled.length === 0) {
      onAnswer([]);
      return;
    }

    const parsed = filled.map((field) => parseLinkedInUrl(field));
    if (parsed.some((entry) => !entry.valid)) {
      setError("One of those is not a profile URL — check for /in/ in the address.");
      return;
    }

    onAnswer(parsed.map((entry) => entry.normalized!).slice(0, 3));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="space-y-2">
        {fields.map((field, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ENTRANCE}
            className="flex items-start gap-2"
          >
            <Input
              label={`Profile ${index + 1}`}
              type="url"
              value={field}
              onChange={(event) => update(index, event.target.value)}
              error={index === 0 ? error : null}
              placeholder="https://www.linkedin.com/in/…"
            />
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="shrink-0"
                aria-label={`Remove profile ${index + 1}`}
                onClick={() => setFields((current) => current.filter((_, position) => position !== index))}
              >
                <X className="size-4" />
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {fields.length < 3 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus className="size-3.5" />}
            onClick={() => setFields((current) => [...current, ""])}
          >
            Add another
          </Button>
        )}
        <Button type="submit" size="sm">
          Continue
        </Button>
        <button
          type="button"
          onClick={() => onAnswer([])}
          className="text-xs font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Skip this
        </button>
      </div>

      {step.hint && <p className="mt-2 text-xs text-ink-muted">{step.hint}</p>}
    </form>
  );
}

function ProfileForm({ step, onAnswer }: QuestionInputProps) {
  const [headline, setHeadline] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [skills, setSkills] = React.useState("");
  const [currentTitle, setCurrentTitle] = React.useState("");
  const [currentCompany, setCurrentCompany] = React.useState("");

  function submit() {
    const draft: ManualProfileDraft = {
      headline: headline.trim(),
      about: about.trim(),
      skills: skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 20),
      experience:
        currentTitle.trim() && currentCompany.trim()
          ? [{ title: currentTitle.trim(), company: currentCompany.trim() }]
          : [],
    };

    onAnswer(draft);
  }

  function skip() {
    onAnswer({ headline: "", about: "", skills: [], experience: [] });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-3"
    >
      <Input
        label="Headline"
        value={headline}
        onChange={(event) => setHeadline(event.target.value)}
        placeholder="e.g. Backend engineer focused on payments infrastructure"
        autoFocus
      />

      <div>
        <label
          htmlFor="onboarding-about"
          className="mb-1 block text-xs font-medium text-ink-muted"
        >
          About section
        </label>
        <textarea
          id="onboarding-about"
          value={about}
          onChange={(event) => setAbout(event.target.value)}
          placeholder="Paste it, or write two or three sentences about what you do"
          rows={3}
          className="w-full resize-none rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Current role"
          value={currentTitle}
          onChange={(event) => setCurrentTitle(event.target.value)}
          placeholder="Title"
        />
        <Input
          label="Company"
          value={currentCompany}
          onChange={(event) => setCurrentCompany(event.target.value)}
          placeholder="Company"
        />
      </div>

      <Input
        label="Skills"
        value={skills}
        onChange={(event) => setSkills(event.target.value)}
        placeholder="Comma separated — e.g. Python, system design, SQL"
        hint={step.hint}
      />

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button type="submit" size="sm">
          Continue
        </Button>
        <button
          type="button"
          onClick={skip}
          className="text-xs font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Skip this
        </button>
      </div>
    </form>
  );
}

export function QuestionInput(props: QuestionInputProps) {
  switch (props.step.kind) {
    case "chips":
      return <Chips {...props} />;
    case "url":
      return <UrlField {...props} />;
    case "urlList":
      return <UrlList {...props} />;
    case "profileForm":
      return <ProfileForm {...props} />;
    default:
      return <FreeText {...props} />;
  }
}
