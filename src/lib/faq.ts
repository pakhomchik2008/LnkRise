/**
 * Plain data, deliberately outside the client component that renders it —
 * importing a non-component export from a "use client" module into a server
 * component yields a client reference, not the value.
 */
export const FAQ_ITEMS = [
  {
    q: "Does this post for me or automate my account?",
    a: "It can publish, but only when you press publish. With your account connected, LnkRise posts through the platform's official API: you read the exact text in a confirmation dialog, and it goes out immediately under your own name. No scheduler, no background posting, nothing that acts while you are away. Outreach and comments are never automated — you get the draft and the search query, you do the sending.",
  },
  {
    q: "Do you need my password or account access?",
    a: "No. You sign in with your own email or an OAuth provider you already trust, and you tell us about your profile — either by connecting an account you control or by filling in a short form. We never ask for platform credentials.",
  },
  {
    q: "Where do the numbers on the analytics page come from?",
    a: "From you, mostly. Three places, and you choose. Once your account is connected, LnkRise pulls post impressions and reach straight from the platform's official creator-analytics API. A companion browser extension can read the numbers off your own analytics page when you click it. And there is always a thirty-second manual form. No single route covers everything — total connections has no API at all — so the manual form stays whichever you pick.",
  },
  {
    q: "Is the advice actually specific to my field?",
    a: "The plan is generated against your field, your goal, your stated time budget and the creators you named. If it reads like generic advice, that is a bug — the whole point is the version that only applies to you.",
  },
  {
    q: "How much time does this take each day?",
    a: "You choose fifteen, thirty or sixty minutes during onboarding, and the plan is sized to fit. At fifteen minutes it is engagement only; at an hour it includes writing. It does not quietly hand you an hour of work when you asked for fifteen minutes.",
  },
  {
    q: "What happens when the trial ends?",
    a: "Nothing is deleted. Your profile audit, plan and history stay; the daily brief stops regenerating until you pick a plan. If you come back in three months, your data is where you left it.",
  },
];
