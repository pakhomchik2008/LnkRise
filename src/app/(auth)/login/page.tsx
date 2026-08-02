import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";
import { devSignInEnabled, googleEnabled, linkedinEnabled } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <Suspense fallback={<Skeleton className="h-80 w-full" rounded="md" />}>
        <AuthForm
          mode="login"
          googleEnabled={googleEnabled}
          linkedinEnabled={linkedinEnabled}
          devSignInEnabled={devSignInEnabled}
        />
      </Suspense>

      <p className="mt-8 text-center text-sm text-ink-muted">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
          Create one
        </Link>
      </p>
    </div>
  );
}
