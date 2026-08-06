# Writing and publishing content

Phase 4 core: the hub, the generation flow, the editor and the template
library. The calendar and carousel generation are not built yet — see the end.

## Plain text, not rich text

The spec asked for Tiptap with a formatting toolbar. The platform renders post
bodies as **plain text**: no bold, no italic, no headings. A formatting
toolbar would show the writer styling that the platform strips on publish, so
the preview would be lying about the thing the preview exists to show.

What is built instead is a plain textarea with a character-accurate preview.
The one concession is a **Unicode bold** button, which is what people actually
use — the mathematical alphanumeric block survives because it is characters
rather than markup. It carries a real cost, so the UI says so when it is used:
screen readers announce those glyphs as individual symbols or skip them, and
they are not searchable.

## The fold

`FOLD` in `lib/post-analysis.ts`: 210 characters on desktop, 140 on mobile,
before the feed collapses the post behind "…see more". These are approximate,
set by the platform, and depend on line breaks as well as character count. The
preview marks the fold and the copy calls it a guide rather than a promise.

## What the feedback panel does and does not claim

`analyzePost()` is deterministic and runs on every keystroke. No model call —
a round-trip per character would be slow and pointless for counting.

It reports length, read time, where the fold lands, an opening score and
whether there is an ask at the end. It does **not** predict performance. There
is no engagement data behind any of it, and the panel says as much in place:
the opening score reads structure, not whether the idea is interesting.

The spec's example copy — "posts about [topic] get 3x more engagement" — is
not implemented and should not be. We have no measurements that would support
that number, and inventing one is the same failure as the engagement score
dressing up self-reported task ticks as a result.

Two heuristics worth not regressing:

- **CTA detection is narrow on purpose.** A bare `\b(share|comment|follow)\b`
  matched "excited to share that I joined" — an announcement with no ask in it
  — and scored posts as having a CTA when they had none. Each pattern now
  carries the context that points the verb at the reader.
- **Rewrites never return the input.** Every mechanical transformation no-ops
  on some input (one sentence to "shorten", nothing to strip), and handing the
  user their own text back as an "alternative" reads as a broken feature.

## Generation: three steps, not one

`lib/ai/content.ts` — concepts, then an outline, then the draft.

Split because the user gets to redirect it twice. The outline step is where a
wrong angle is cheap to fix: editing four bullet points beats explaining what
is wrong with 1,200 finished characters.

## Quota

`lib/quota.ts`. `PLAN_ACCESS.aiGenerationsPerDay` had existed since Phase 1
and nothing read it, so the limit did not exist. It does now.

The counter increments **before** the model runs, not after: two requests
arriving together would both pass a check-then-write, so the increment and the
limit test have to be one atomic operation. The cost is that a failed
generation would consume a slot, which is why every action calls
`releaseGeneration` on failure.

A row per user per calendar day (`@db.Date`, composite unique — same shape as
`DailyBrief`, for the same reason) means the limit resets without a cleanup
job.

Verified: 6 concurrent reservations against a limit of 3 grant exactly 3, the
stored counter lands on 3, and release never goes negative.

## Templates

`lib/content-templates.ts`. Eight categories, 15 templates, 10 free and 5 Pro.

Structure over prose — each is a shape that works, not a script to copy. The
fill-in version uses `[square brackets]` because `{curly braces}` look
deliberate enough that people leave them in.

Premium templates keep their name and category so the gate is legible, but the
structure, example and skeleton are stripped **on the server**. Hiding them in
the client would put the paid content one "view source" away.

## Proper nouns

`lib/ai/mock/vars.ts` is the single source of template placeholders.

`{topic}` used to be `industry.toLowerCase()`, for templates that drop the
field mid-sentence. That turned "B2B SaaS" into "b2b saas" — a typo in a
message the user is about to send to a stranger. Both `{industry}` and
`{topic}` now carry the field exactly as typed: someone who wrote "platform
engineering" already gets lowercase, and someone who wrote "B2B SaaS" keeps
their capitals. The user's own spelling is the only source that knows which is
right.

This was fixed in six places at once and centralised so it cannot drift again.

## Not built yet

- **Content calendar** (spec Task 4). Scheduling is only worth having once
  publishing works, and publishing is gated behind `communityApiEnabled()`,
  which needs LinkedIn to approve the app for `w_member_social`.
  When it is built, "AI auto-schedule" must handle the common case honestly:
  most users have no engagement data, and suggesting "optimal times" from
  nothing is the invented-statistic failure again.
- **Carousel generation** (spec Task 5). Agreed approach is a Canva
  integration with the same dry-run shape as email — real with a key, logged
  without one. No Canva credentials or partner approval yet.
