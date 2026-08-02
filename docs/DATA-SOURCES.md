# Where the numbers come from

Three routes fill `AnalyticsSnapshot`, and they coexist on purpose — no single
one covers every metric. The `source` column records which wrote each row.

> **Correction.** An earlier version of this document, and some UI copy, said
> personal analytics were unavailable through any public API. That was wrong.
> LinkedIn ships a **Member Post Analytics API** (`memberCreatorPostAnalytics`,
> permission `r_member_postAnalytics`) which returns per-member impressions and
> reach. The claim has been removed from the FAQ and the dashboard.

## Coverage

| Field | Official API | Extension | Manual |
|---|---|---|---|
| `postImpressions` | yes — `IMPRESSION`, daily | yes | yes |
| `profileViews` | partial — `PROFILE_VIEW_FROM_CONTENT` is only views driven by your posts, not the total | yes — the real total | yes |
| `followers` | no — `FOLLOWER_GAINED_FROM_CONTENT` is a delta, and there is no member follower-count endpoint | yes | yes |
| `connections` | no endpoint at all | yes | yes |
| `engagementRate` | derived from reactions + comments over impressions | — | — |

The gaps in column one are why the other two columns still exist.

---

## 1. Official API — `source: "api"`

`src/lib/linkedin/client.ts`, `sync.ts`, `tokens.ts`.

Requires LinkedIn to approve the app for the **Community Management API**
product. Apply free at developer.linkedin.com; approval is not instant and
needs a verified company Page attached to the app.

Two permissions matter:

- `r_member_postAnalytics` — read the member's own post analytics
- `w_member_social` — publish to the member's own feed

Enable with `LINKEDIN_COMMUNITY_API=enabled` **only after approval**. Setting it
early breaks sign-in outright: LinkedIn rejects the entire authorization
request when an app asks for a scope it does not hold, so users cannot log in at
all. Until then the app requests `openid profile email` and nothing more.

Request shape (documented, **not yet verified against a live approved app** —
expect to adjust response parsing rather than request construction):

```http
GET /rest/memberCreatorPostAnalytics?q=me&queryType=IMPRESSION&aggregation=DAILY
    &dateRange=(start:(day:1,month:8,year:2026),end:(day:15,month:8,year:2026))
LinkedIn-Version: 202606
X-Restli-Protocol-Version: 2.0.0
```

Notes that cost time if missed:

- One request per metric — `queryType` takes a single value.
- `DAILY` is rejected for `MEMBERS_REACHED`, `LINK_CLICKS`,
  `FOLLOWER_GAINED_FROM_CONTENT` and `PROFILE_VIEW_FROM_CONTENT`; those are
  lifetime totals only.
- `metricType` in the response is a plain string from version `202605` onward
  and a namespaced object before it. Both are handled.
- Tokens last ~60 days. Refresh tokens go only to approved partners, so expiry
  surfaces as "reconnect" rather than a silent refresh.
- LinkedIn's own docs warn that `RESHARE`, `REACTION` and `COMMENT` do not match
  the numbers shown in the UI.

## 2. Browser extension — `source: "extension"`

`extension/`. Manifest V3, unpacked install.

Reads the numbers the platform is already displaying to the signed-in member
about themselves and POSTs them to `/api/ingest/analytics` with an ingest key
generated in Settings.

Constraints enforced in code, not by convention:

- **No persistent content script.** Nothing runs on the site until the user
  clicks the toolbar button; injection uses `activeTab` + `scripting`.
- **Own pages only.** `popup.js` refuses to inject unless the path starts with
  `/analytics/` or `/dashboard/`. Another member's profile cannot be read.
- **Read-only.** No clicks, no navigation, no form submission, no posting.
- **Confirmation before transmission.** The extracted numbers are shown in the
  popup; nothing leaves the browser until the user presses Send.
- **No background sync.** There is no alarm, no polling, no service worker loop.

The parser matches on visible label text because the analytics DOM has no stable
identifiers. It will return nothing when the layout changes — by design, since
returning wrong numbers is worse. The manual form is the fallback.

**Terms of service.** Reading page content with a script sits in a grey area of
most platforms' terms even when it is the user's own data on their own screen.
Established products in this category (Shield, AuthoredUp) work the same way.
The risk lands on the end user's account. The Settings panel says so before
install, and the manual path carries no such question.

## 3. Manual entry — `source: "manual"`

A four-field form on the dashboard. Always available, never removed. It is the
only route that covers every field with no approval and no ambiguity.

---

## Publishing

`publishDraft` in `src/app/(app)/dashboard/actions.ts` posts through the official
`POST /rest/posts` endpoint. The created post's URN comes back in the
`x-restli-id` **header**, not the body, and is stored on `Post.linkedinUrn`.

The confirmation dialog shows the exact text before anything is sent. There is
no scheduler and no background publish path — every post that leaves this app
was pressed by a human who had just read it.

Outreach and comments are never automated. The app produces a draft message and
a search query; the sending is done by the user, deliberately.
