import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";
import { devSignInEnabled, googleEnabled, linkedinEnabled } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create your account",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm">
      <Suspense fallback={<Skeleton className="h-80 w-full" rounded="md" />}>
        <AuthForm
          mode="signup"
          googleEnabled={googleEnabled}
          linkedinEnabled={linkedinEnabled}
          devSignInEnabled={devSignInEnabled}
        />
      </Suspense>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
