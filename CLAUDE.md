# LnkRise — working notes

## What this is

A daily coaching product for building a professional presence. The user answers a short questionnaire; the app produces a profile audit, a four-week strategy, and one brief per day with a post draft, outreach targets and engagement suggestions.

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript strict · Tailwind v4 · Framer Motion · Prisma + PostgreSQL · NextAuth v5 · Anthropic SDK · Zustand · React Query · Recharts

## Rules that are not negotiable

1. **No platform branding.** No third-party logos, icons, marks or corporate colours. Brand primary is `#2b59ff`, not `#0A66C2`. See `docs/PLATFORM-DATA.md`.
2. **No scraping, no automation, no credential requests.** The product writes drafts; the user acts.
3. **The dev sign-in stays gated on `NODE_ENV === "development"`.** It is a passwordless account-creating form. It must never register in production.
4. **Every server action re-checks the session and scopes queries by `userId`.** Never trust an id from the client.
5. **No fabricated social proof.** Testimonials and case studies must be labelled as placeholders until real, permissioned ones exist.

## Conventions

- Server Components by default; `"use client"` only for interactivity.
- Keep files under ~300 lines — extract components and hooks instead.
- Data that a Server Component needs must not live in a `"use client"` module. Importing a non-component export across that boundary yields a client reference, not the value. `src/lib/faq.ts` exists for exactly this reason.
- Prisma `Json` columns go through `toJson` / `fromJson` in `src/lib/prisma.ts` rather than scattered casts.
- Daily records key on `@db.Date` at UTC midnight via `toUtcDay()`.
- Motion: 150ms micro, 300ms transitions, 500ms page-level, ease-out on entrances. `MotionConfig reducedMotion="user"` handles the accessibility case globally.
- SVG gradient ids must be deterministic. `useId()` for them causes hydration mismatches.
- `AnimatePresence mode="wait"` wedges when a child unmounts and remounts under a new key in quick succession — avoid it for anything that toggles.

## AI layer

`src/lib/ai/provider.ts` is the only place that talks to Anthropic. Model is `claude-opus-5`, structured output via `output_config.format`, validated with Zod after parsing. `withFallback` routes to `src/lib/ai/mock/` when the key is missing or a call fails, so no feature is ever blocked on a key. `stop_reason === "refusal"` is checked before reading content.

The mock engine is real coaching content, not filler — it is what a user sees before any key exists, and it is seeded so output is stable per user.

## Commands

```bash
npm run dev / build / typecheck
npm run db:push / db:seed / db:studio
```
