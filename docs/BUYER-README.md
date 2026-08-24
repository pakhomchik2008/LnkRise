# LnkRise — buyer README

What you're getting, what you're not, and what it takes to run it. Written for
technical due diligence, not marketing — see `README.md` for the product
description and local setup walkthrough.

## What this is

A Next.js app: a client kabinet where each end-user gets a daily coaching
brief (post draft, outreach targets, engagement suggestions) generated from a
short onboarding questionnaire. Sold as source code and a working deploy, not
as a running business — see "What's not included" below.

## What's built and working

- Auth (NextAuth v5), onboarding chat flow, dashboard, daily brief
- Content hub: AI generation, editor, templates, paraphrase, scheduling with
  reminders
- Connection lanes and engagement scoring
- Daily brief cron (generation + email)
- **Coach admin** (`/coach`): a coach/agency account manages multiple client
  accounts from one login — add a client by email, a read-only per-client
  overview, and white-label branding (name + logo) that replaces the LnkRise
  wordmark in that client's own sidebar. This is what makes the product usable
  by an agency reselling it under their own name.
- Every server action re-checks the session and scopes its query by the
  caller's own `userId` (or, for coach routes, by `coachId` ownership) — see
  `src/lib/auth.ts:requireUserId` / `requireCoachId`.

## What's not included

- **Billing.** No Stripe integration — `/billing` is a placeholder page. If
  you're reselling to your own clients, you invoice them yourself; nothing in
  this codebase assumes a payment processor.
- **Analytics dashboard.** Built. `/analytics` renders the growth score,
  7/30/90-day trend chart with per-metric switching, and a derived insights
  panel. Range is server-sliced by plan (trial gets 7 days; Starter and Pro
  get the full 90) so the RSC payload never leaks the wider window to a
  locked account.
- **Growth/traction promises.** Nothing here automates posting, connecting or
  messaging on a platform — see `docs/PLATFORM-DATA.md` for why, and don't
  represent it otherwise to your own clients. The product writes drafts; the
  human sends them.
- **Ongoing support.** This is a one-time handoff (repo + a session walking
  through the stack), not a support contract.
- **An AI provider key.** The mock engine (`src/lib/ai/mock/`) is real,
  field-specific coaching content and works with zero keys, so the product is
  fully demoable without one. Wiring in `ANTHROPIC_API_KEY` for live
  generation is on you.

## Stack

Next.js 15 (App Router, Server Actions), TypeScript strict, Tailwind v4,
Framer Motion, Prisma + PostgreSQL, NextAuth v5, Zustand, React Query,
Recharts. No exotic infrastructure — deploys to Vercel + any managed Postgres
(Neon, Supabase, RDS) with no code changes.

## Getting it running

```bash
npm install
npx prisma db push
npm run db:seed   # optional — blog posts and sample case studies
npm run dev
```

Two environment variables are required (`DATABASE_URL`, `AUTH_SECRET`);
everything else is optional and the app degrades gracefully — see
`.env.example` for the full list and what each one unlocks. In development,
an email-only sign-in form creates accounts with no OAuth setup needed; it is
compiled out of production builds (`NODE_ENV !== "development"` gate in
`src/lib/auth.ts`), so you'll want Google or LinkedIn OAuth configured before
a client ever sees this in production.

## Platform constraints that carry over to you

This product does not scrape, does not ask for a platform password, and does
not automate posting or connecting — that's not a feature gap, it's a
deliberate stance against LinkedIn's terms of service (full reasoning in
`docs/PLATFORM-DATA.md`). If you build on this, keep that boundary: an
automated-posting feature bolted on later is the fastest way to get your own
clients' accounts restricted.

## Brand

Primary color is `#2b59ff`, not LinkedIn's `#0A66C2` — deliberate, to avoid a
trademark problem. No third-party logos or marks anywhere in the codebase.
You're free to re-skin it under your own brand; the coach white-label feature
(above) already does this per-client without touching code.
