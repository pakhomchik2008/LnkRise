# The daily brief

How a day of the plan gets made, scored and delivered.

## Where briefs come from

`lib/brief-service.ts` — `ensureBriefForUser(userId, date)`.

Two callers:

- **Onboarding** builds day 1 inline, because it has to write the analysis,
  the strategy and the first brief in one transaction — the brief cannot be
  generated from the database until the strategy is in it.
- **The cron** builds every day after.

Before this service existed only onboarding wrote briefs, so a user's plan
silently stopped after their first day.

Generation is idempotent: an existing brief for that date is returned
untouched, so re-running the cron never replaces a brief the user has already
started working through.

## The cron

`app/api/cron/daily-brief/route.ts`, scheduled in `vercel.json`.

It runs **hourly**, not once at 06:00 UTC. The spec asked for both a fixed UTC
time and a per-user send hour, and those cannot both hold — 07:00 local is a
different UTC hour in every timezone. Hourly, plus an equality check against
each user's `emailBriefHour` in their own `timezone`, is what makes the
per-user setting real.

Brief *dates* stay on UTC days (`toUtcDay`), matching every read path in the
app. A user far enough east receives their brief while UTC is still on the
previous date; their dashboard reads in UTC too, so the two agree.

Protection: the route requires `Authorization: Bearer $CRON_SECRET`, which
Vercel sends automatically. **With `CRON_SECRET` unset the route returns 503
rather than running unauthenticated** — it generates briefs and sends mail, so
an open endpoint would let anyone burn the AI budget and mail users.

Batching is 5 users at a time, keeping generation inside the function timeout
and off the model's rate limit. Each user gets one retry; a second failure is
logged and that user is skipped rather than failing the whole run.

## Email

`lib/email/send.ts` mirrors the AI layer: real when `RESEND_API_KEY` exists,
an honest no-op when it does not. Without a key the message is rendered in
full and logged, so the whole path is exercisable before any account exists.

A dry run does **not** set `DailyBrief.emailSent`. If it did, turning the key
on later would silently skip every brief generated before that point.

The template (`lib/email/templates/daily-brief.ts`) is an HTML string, not
JSX: Next.js refuses to bundle `react-dom/server` into the App Router, so
rendering a component to markup is unavailable. Little is lost — mail HTML is
inline-styled tables regardless, since Outlook's Word rendering engine ignores
flexbox and grid and Gmail strips `<style>` blocks in several contexts. Every
interpolated value is escaped; the brief is model-written and the name is
user-supplied, so neither is trusted markup.

## Yesterday's engagement score

`lib/briefs.ts` → `engagementScore()`, read from the database by
`lib/engagement.ts`, rendered by `components/dashboard/engagement-score.tsx`.

Three states, and the distinction is the point:

| State | When | How it renders |
| --- | --- | --- |
| `idle` | no brief yesterday | nothing |
| `unverified` | tasks ticked, no analytics for both days | **red warning, not a score** |
| `measured` | tasks ticked *and* impressions known for yesterday and the day before | a score |

Ticking a box is self-reported and unfalsifiable — someone can complete every
task and reach nobody. A number built only from task completion measures
effort, not result, and presenting it as a result would be the product lying
about whether the work reached anyone. So `unverified` deliberately refuses to
show its number as an outcome: the card says yesterday *cannot* be scored and
points at the ways to connect real numbers.

When both days are known, reach carries 40% of the weight and completion 60%.
A flat day scores 50 on the reach half rather than 0 — posting into a quiet
day is not a failure — and ±40% movement is treated as the full range, beyond
which the number stops discriminating usefully.

## Connections

`lib/ai/connection-strategy.ts`, with mock content in
`lib/ai/mock/connections.ts`, surfaced at `/connections`.

Four fixed lanes: `industry_leaders`, `peers`, `clients_recruiters`,
`content_creators`. The ids are fixed rather than model-invented because the
page maps progress per lane — a generated category name would break that
mapping the moment it changed between runs. Labels *are* allowed to change per
goal ("Potential clients" for someone selling, "Recruiters and hiring
managers" for someone job-hunting).

The AI path rebuilds the response by canonical order and falls back per slot,
because the schema pins the four ids but not their order or uniqueness — a
model can return four valid entries that are all `peers`.

Content is stored as base + per-goal overlay rather than 20 hand-written
entries. Two composition bugs came out of that and are worth not
reintroducing:

- Both halves filling `{industry}` produced "I work in X … I am focused on X
  roles" in one message. Intents no longer name the field where the opener
  already did.
- `{topic}` lowercases the value, which mangles proper nouns — "your posts on
  b2b saas onboarding" reads as a typo. Openers use `{industry}`.

Every generated message stays under LinkedIn's 300-character limit for a
connection note.

**Plan gating.** The nav badges this page Pro and `PLAN_ACCESS` agrees
(`connectionStrategy` is false on trial), so the page behaves that way: trial
sees the first lane in full and the other three described but not spelled out.
The search string and message of a locked lane are stripped **on the server**,
not hidden in the client — otherwise the gate is one "view source" away from
being pointless. Every account is on trial until billing lands in Phase 6.
