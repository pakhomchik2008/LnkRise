"use client";

import { signOut } from "next-auth/react";
import * as React from "react";
import {
  deleteAccount,
  updatePreferences,
  updateProfile,
} from "@/app/(app)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { CONTENT_TONES, POSTING_FREQUENCIES, TIME_BUDGET_OPTIONS } from "@/lib/constants";

export interface SettingsUser {
  name: string | null;
  email: string;
  linkedinUrl: string | null;
  emailBriefEnabled: boolean;
  emailBriefHour: number;
  timezone: string;
  language: string;
  postingFrequency: string;
  contentTone: string;
  dailyTimeBudget: number;
  providers: string[];
  plan: string;
}

const selectClass =
  "h-11 w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-brand-500";

function useFormAction(action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>) {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);

  return {
    pending,
    async submit(formData: FormData) {
      setPending(true);
      const result = await action(formData);
      setPending(false);

      if (result.ok) toast({ tone: "success", title: "Saved" });
      else toast({ tone: "error", title: result.error ?? "Could not save" });
    },
  };
}

export function ProfileSection({ user }: { user: SettingsUser }) {
  const { pending, submit } = useFormAction(updateProfile);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear inside LnkRise.</CardDescription>
        </div>
      </CardHeader>

      <form action={submit} className="space-y-3">
        <Input label="Name" name="name" defaultValue={user.name ?? ""} required />
        <Input
          label="Email"
          value={user.email}
          disabled
          hint="Changing the sign-in email is not supported yet."
        />
        <Input
          label="Profile URL"
          name="linkedinUrl"
          type="url"
          defaultValue={user.linkedinUrl ?? ""}
          hint="Used for the profile audit. Public URL only — never a password."
        />
        <Button type="submit" loading={pending}>
          Save profile
        </Button>
      </form>
    </Card>
  );
}

export function PreferencesSection({ user }: { user: SettingsUser }) {
  const { pending, submit } = useFormAction(updatePreferences);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Coaching and delivery</CardTitle>
          <CardDescription>How the plan is shaped and when it reaches you.</CardDescription>
        </div>
      </CardHeader>

      <form action={submit} className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold tracking-wide text-ink-muted">
            MORNING BRIEF
          </legend>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="emailBriefEnabled"
              defaultChecked={user.emailBriefEnabled}
              className="mt-0.5 size-4 rounded border-hairline accent-[var(--color-brand-500)]"
            />
            <span>
              <span className="block text-sm font-medium text-ink">Email me the brief</span>
              <span className="block text-xs text-ink-muted">
                Delivery is wired up in a later phase — this stores the preference now.
              </span>
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Send at</span>
              <select name="emailBriefHour" defaultValue={user.emailBriefHour} className={selectClass}>
                {Array.from({ length: 24 }).map((_, hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </label>

            <Input label="Timezone" name="timezone" defaultValue={user.timezone} />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold tracking-wide text-ink-muted">STRATEGY</legend>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                Posting frequency
              </span>
              <select
                name="postingFrequency"
                defaultValue={user.postingFrequency}
                className={selectClass}
              >
                {POSTING_FREQUENCIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Tone</span>
              <select name="contentTone" defaultValue={user.contentTone} className={selectClass}>
                {CONTENT_TONES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.blurb}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                Minutes per day
              </span>
              <select
                name="dailyTimeBudget"
                defaultValue={user.dailyTimeBudget}
                className={selectClass}
              >
                {TIME_BUDGET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.blurb}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Language</span>
              <select name="language" defaultValue={user.language} className={selectClass}>
                <option value="en">English</option>
              </select>
            </label>
          </div>
        </fieldset>

        <Button type="submit" loading={pending}>
          Save preferences
        </Button>
      </form>
    </Card>
  );
}

export function ConnectionsSection({ user }: { user: SettingsUser }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Connected accounts</CardTitle>
          <CardDescription>What you have linked for signing in.</CardDescription>
        </div>
        <Badge tone="info" className="capitalize">
          {user.plan}
        </Badge>
      </CardHeader>

      {user.providers.length === 0 ? (
        <p className="text-sm text-ink-muted">
          You are signed in with the development email method. Connect an OAuth provider once its
          credentials are configured.
        </p>
      ) : (
        <ul className="space-y-2">
          {user.providers.map((provider) => (
            <li
              key={provider}
              className="flex items-center justify-between rounded-[var(--radius-sm)] border border-hairline px-3 py-2.5"
            >
              <span className="text-sm font-medium capitalize text-ink">{provider}</span>
              <Badge tone="success" dot>
                Connected
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DangerZone({ user }: { user: SettingsUser }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onDelete(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await deleteAccount(formData);
    setPending(false);

    if (result.ok) {
      toast({ tone: "success", title: "Account deleted" });
      await signOut({ callbackUrl: "/" });
    } else {
      setError(result.error);
    }
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <div>
          <CardTitle className="text-red-700">Delete this account</CardTitle>
          <CardDescription>
            Removes your plan, briefs, tasks, posts and logged numbers. There is no undo and no
            backup.
          </CardDescription>
        </div>
      </CardHeader>

      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete account
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete your account"
        description="This is permanent. Everything listed above is removed immediately."
      >
        <form action={onDelete} className="space-y-3">
          <Input
            label="Type your email to confirm"
            name="confirmEmail"
            autoComplete="off"
            error={error}
            required
          />
          <p className="font-mono text-xs text-ink-muted">{user.email}</p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Keep my account
            </Button>
            <Button type="submit" variant="danger" loading={pending}>
              Delete permanently
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
