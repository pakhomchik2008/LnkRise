/**
 * Plain data, deliberately outside the client component that renders it —
 * importing a non-component export from a "use client" module into a server
 * component yields a client reference, not the value.
 */
export const FAQ_ITEMS = [
  {
    q: "Does this post for me or automate my account?",
    a: "No. LnkRise writes the draft and tells you who to talk to; you publish and send. Automating a networking platform account violates every major platform's terms and is a reliable way to get restricted. The coaching is the product, not the posting.",
  },
  {
    q: "Do you need my password or account access?",
    a: "No. You sign in with your own email or an OAuth provider you already trust, and you tell us about your profile — either by connecting an account you control or by filling in a short form. We never ask for platform credentials.",
  },
  {
    q: "Where do the numbers on the analytics page come from?",
    a: "From you, mostly. Professional platforms do not expose personal analytics through a public API, so LnkRise gives you a thirty-second daily form to log the four numbers that matter. It is the honest version — anything claiming automatic personal stats is either scraping or guessing.",
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
