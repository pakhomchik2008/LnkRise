# LnkRise

A daily coaching plan for building a professional presence: it reads your profile and your goal, then hands you one concrete plan a day — what to write, who to reach out to, what to reply to, and whether any of it is working.

**Built so far.** Foundation (design system, component library, database, auth, landing site, onboarding, dashboard, settings). Content hub with AI generation, editor, templates, scheduling reminders. Daily-brief cron with email delivery, engagement scoring, four connection lanes. Live analytics dashboard with growth score, plan-gated ranges, insights. Coach admin (multi-client, per-client cabinet, white-label branding). Role-gated admin panel with user management, platform analytics, blog CRUD. See the very bottom for what is still stubbed.

---

## Running it locally

You need Node 20+ and a PostgreSQL database. No API keys are required — the app falls back to a deterministic mock engine wherever a key is missing.

```bash
npm install
```

Postgres, via Homebrew:

```bash
brew install postgresql@17 && brew services start postgresql@17 && createdb lnkrise
```

Create `.env` in the project root:

```
DATABASE_URL="postgresql://YOUR_USER@localhost:5432/lnkrise"
AUTH_SECRET="paste the output of: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

`.env.example` lists every variable the app reads, including the optional ones. Note that Prisma's CLI reads `.env` and not `.env.local`, which is why local config lives in `.env`.

Then:

```bash
npx prisma db push && npm run db:seed && npm run dev
```

Open <http://localhost:3000>. In development a sign-in form accepts any email address and creates the account — see Security below.

---

## What runs without API keys

| Subsystem | Without a key | With a key |
|---|---|---|
| Coaching content | Deterministic mock engine in `src/lib/ai/mock/` — real, field-specific advice, seeded per user so it is stable | Claude (`claude-opus-5`) with JSON-schema-constrained output, validated with Zod |
| Sign-in | Email-only development provider | Google and/or LinkedIn OAuth |
| Email | Preferences stored, nothing sent | Resend |
| Billing | `/billing` shows plans, checkout disabled | Stripe Checkout + billing portal, live |

`src/lib/ai/provider.ts` is the single seam. Every AI call goes through `withFallback`, so a missing key, a malformed response or a refusal all degrade to the mock path rather than failing the request.

---

## Security notes

**The development sign-in is not registered in production.** It accepts an email with no password and creates the account, which is exactly why `src/lib/auth.ts` only adds it when `NODE_ENV === "development"`. Deploying with `NODE_ENV=production` and no OAuth credentials produces a login page that says no sign-in method is configured — it does not silently fall back to the open form.

Other measures in place: route protection in `src/middleware.ts`, every server action re-checks the session and scopes queries by `userId`, all action input is validated with Zod, account deletion requires typing the account email, and security headers are set in `next.config.ts`.

**Platform policy:** the app never asks for a networking platform password, never automates an account, and never scrapes. See [`docs/PLATFORM-DATA.md`](docs/PLATFORM-DATA.md) for what that rules out and what it means for analytics.

---

## Layout

```
src/
├── app/
│   ├── (marketing)/     landing, pricing, blog
│   ├── (auth)/          login, signup
│   ├── (app)/           dashboard, daily brief, settings, placeholder sections
│   ├── onboarding/      full-screen questionnaire (outside the app shell)
│   └── api/auth/        NextAuth route handler
├── components/
│   ├── ui/              19-component design system
│   ├── landing/         marketing sections
│   ├── onboarding/      chat flow
│   ├── dashboard/       widgets
│   └── shared/          logo, sidebar, topbar
├── lib/
│   ├── ai/              provider, prompts, schemas, mock engine
│   ├── auth.ts          NextAuth config (+ auth.config.ts for the edge)
│   ├── briefs.ts        brief → tasks, growth score
│   └── constants.ts     plans, nav, option sets
├── hooks/  stores/  types/
└── prisma/  schema + seed
```

## Commands

```bash
npm run dev        # development server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run db:push    # apply the schema
npm run db:seed    # blog posts and sample case studies
npm run db:studio  # database browser
```

---

## Design system

Tokens live in `src/app/globals.css`. Brand primary is `#2b59ff` with `#7c3aed` as the secondary — deliberately not any platform's corporate colour. There are no third-party logos, icons or marks anywhere in the codebase.

Motion follows one scale: 150ms for micro-interactions, 300ms for transitions, 500ms for page-level movement, with `cubic-bezier(0.25, 0.46, 0.45, 0.94)` on entrances. `MotionConfig reducedMotion="user"` means every Framer animation honours the OS preference without per-component handling.

---

## Deviations from the original brief

Each of these was a deliberate call, not an oversight:

1. **No profile scraping.** LinkedIn blocks it and it violates their terms. The app uses OAuth where available and a manual entry path otherwise.
2. **Analytics are logged by hand.** Personal analytics are not exposed through any public API. A thirty-second daily form is the honest version; anything automatic would be scraping or estimation.
3. **`@db.Date` for daily records.** The brief specified `DateTime @default(now())` under a `@@unique([userId, date])`, which would have been unique per microsecond — one user could get unlimited briefs per day.
4. **No tRPC.** It appeared in the brief's folder structure but not its dependency list. Server Actions cover the same ground.
5. **Own palette.** `#0A66C2` is LinkedIn's corporate blue; using it as our brand colour invites a trademark problem.
6. **Testimonials and case studies are labelled placeholders.** Invented quotes and results presented as real customers would be misleading. The copy says so on the page, and the sample case studies are seeded unpublished.

## Still to come

- **LinkedIn's official Community Management API.** Not a claimed feature. The client code (`src/lib/linkedin/`) exists and is wired behind `LINKEDIN_COMMUNITY_API=enabled` (off by default), but it has never run against a live, LinkedIn-approved account, and that approval isn't guaranteed. What ships today — manual publish-and-copy, the browser extension, the manual analytics form — doesn't depend on it.
- **Coaching content in languages other than English.** The settings language selector only offers English today.

See `docs/BUYER-README.md` for the technical due-diligence version of this list.
