# Where profile and analytics data comes from

This file exists because the honest answer is unusual enough that people assume a bug.

## What LnkRise does not do

- **No scraping.** Not of profiles, not of feeds, not of anyone's posts. Professional networking platforms prohibit it in their terms of service, they detect and block it, and accounts that get caught are restricted or removed. That risk would sit with the user, not with us.
- **No credentials.** We never ask for a password to any other platform, and we do not sign in as the user.
- **No automation.** LnkRise does not post, connect, message or comment on anyone's behalf. It writes the draft; the user sends it.

## What that leaves

**Profile data.** Two paths:

1. **OAuth.** Signing in with a professional account gives us the basic OpenID Connect claims — name, email, picture. That is genuinely all that endpoint returns. There is no public API for a person's own connections, posts or analytics, and the Marketing and Community Management APIs are gated behind partnership approval that a product like this does not qualify for.
2. **Manual entry.** The user types their headline, About section, experience and skills into a short form. Treated as a first-class path, not an error state.

**Analytics.** The user logs four numbers a day: profile views, post impressions, followers, connections. This takes about thirty seconds and it is surfaced as a task in the daily brief so it becomes habitual.

Every other option was considered and rejected:

| Option | Why not |
|---|---|
| Scrape the analytics page | Terms violation, detectable, risks the user's account |
| Browser extension that reads the page | Same data access question, moved into a place with wider permissions. May be revisited with an explicit consent flow; the `source` column on `AnalyticsSnapshot` already anticipates it |
| Estimate from post engagement | Guessing, presented as measurement |
| Third-party aggregators (e.g. Metricool) | Legitimate, but the user must already have an account and connect it. Supported later as an optional source, not a default |

## Why the manual step is defensible

The four numbers only need to be accurate relative to themselves. What matters is the trend — did profile views go up in the week you started commenting daily? A number the user typed from their own screen answers that as well as an automated one would, and it does not put their account at risk.

The `AnalyticsSnapshot.source` column records where each row came from (`manual`, `api`, `extension`, `metricool`) so mixed sources stay distinguishable if that changes.
