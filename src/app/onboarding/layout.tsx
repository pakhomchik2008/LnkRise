export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden px-5 py-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-32 size-[30rem] rounded-full bg-brand-500/10 blur-3xl [animation:var(--animate-drift)]" />
        <div className="absolute -right-32 bottom-0 size-[26rem] rounded-full bg-violet-brand/10 blur-3xl [animation:var(--animate-drift)] [animation-delay:-8s]" />
      </div>

      <main id="main">{children}</main>
    </div>
  );
}
