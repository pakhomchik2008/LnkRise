import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8">
        <Link href="/" aria-label="LnkRise home" className="self-start">
          <Logo />
        </Link>
        <main id="main" className="flex flex-1 items-center justify-center py-10">
          {children}
        </main>
      </div>

      <aside
        data-surface="dark"
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center lg:px-12"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 size-[26rem] rounded-full bg-brand-500/25 blur-3xl [animation:var(--animate-drift)]" />
          <div className="absolute -right-24 bottom-0 size-[24rem] rounded-full bg-violet-brand/25 blur-3xl [animation:var(--animate-drift)] [animation-delay:-9s]" />
        </div>

        <blockquote className="relative max-w-md">
          <p className="text-2xl font-semibold leading-snug text-ink">
            The people who grow fastest are not the ones with the most to say. They are the ones who
            show up on the same day, every week, for a year.
          </p>
          <footer className="mt-6 text-sm text-ink-muted">
            The principle the whole product is built around.
          </footer>
        </blockquote>
      </aside>
    </div>
  );
}
