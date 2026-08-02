"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AuthFormProps {
  mode: "login" | "signup";
  googleEnabled: boolean;
  linkedinEnabled: boolean;
  devSignInEnabled: boolean;
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1 .7-2.3 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}

export function AuthForm({ mode, googleEnabled, linkedinEnabled, devSignInEnabled }: AuthFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const authError = searchParams.get("error");

  const [pending, setPending] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const noProviders = !googleEnabled && !linkedinEnabled && !devSignInEnabled;

  async function onOAuth(provider: string) {
    setPending(provider);
    await signIn(provider, { callbackUrl });
  }

  async function onDevSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }

    setPending("dev");
    const result = await signIn("dev", { email, callbackUrl, redirect: false });
    setPending(null);

    if (result?.error) {
      setError("Could not sign in. Check the server logs.");
      return;
    }

    window.location.href = result?.url ?? callbackUrl;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-sm"
    >
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        {mode === "login"
          ? "Pick up where your plan left off."
          : "Six questions, then your first plan. No card needed."}
      </p>

      {authError && (
        <p
          role="alert"
          className="mt-5 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          Sign-in failed. Try again, or use a different method.
        </p>
      )}

      <div className="mt-7 space-y-2.5">
        {googleEnabled && (
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            loading={pending === "google"}
            onClick={() => onOAuth("google")}
            icon={<GoogleGlyph />}
          >
            Continue with Google
          </Button>
        )}

        {linkedinEnabled && (
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            loading={pending === "linkedin"}
            onClick={() => onOAuth("linkedin")}
          >
            Continue with your professional account
          </Button>
        )}
      </div>

      {devSignInEnabled && (googleEnabled || linkedinEnabled) && (
        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-hairline" />
          <span className="text-xs text-ink-muted">or</span>
          <span className="h-px flex-1 bg-hairline" />
        </div>
      )}

      {devSignInEnabled && (
        <form onSubmit={onDevSubmit} className={googleEnabled || linkedinEnabled ? "" : "mt-7"}>
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={error}
            hint="Development sign-in — creates the account if it does not exist."
            required
          />
          <Button type="submit" size="lg" className="mt-3 w-full" loading={pending === "dev"}>
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
      )}

      {noProviders && (
        <div className="mt-7 rounded-[var(--radius-md)] border border-hairline bg-surface-muted p-4">
          <p className="text-sm font-medium text-ink">No sign-in method is configured</p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
            Add <code className="font-mono">GOOGLE_CLIENT_ID</code> and{" "}
            <code className="font-mono">GOOGLE_CLIENT_SECRET</code> to your environment, or run in
            development mode to use the email sign-in.
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
        We never ask for your password to any other platform. Your account here is separate.
      </p>
    </motion.div>
  );
}
