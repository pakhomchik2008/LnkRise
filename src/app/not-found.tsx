import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Logo />
      <p className="mt-10 font-mono text-5xl font-bold text-ink">404</p>
      <h1 className="mt-3 text-xl font-semibold text-ink">That page does not exist</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
        The link may be out of date, or the page may have moved.
      </p>
      <Link href="/" className="mt-6">
        <Button>Back to the start</Button>
      </Link>
    </div>
  );
}
