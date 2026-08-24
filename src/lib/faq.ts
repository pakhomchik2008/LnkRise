/**
 * Plain data, deliberately outside the client component that renders it —
 * importing a non-component export from a "use client" module into a server
 * component yields a client reference, not the value.
 */
export const FAQ_ITEMS = [
  {
    q: "Does this post for me or automate my account?",
    a: "No. LnkRise writes the draft; you read it in a confirmation step and post it yourself, under your own name, whenever you choose. No scheduler, no background posting, nothing that acts while you are away. Outreach and comments work the same way — you get the draft and the search query, you do the sending.",
  },
  {
    q: "Do you need my password or account access?",
    a: "No. You sign in with your own email or an OAuth provider you already trust, and you tell us about your profile — either by connecting an account you control or by filling in a short form. We never ask for platform credentials.",
  },
  {
    q: "Where do the numbers on the analytics page come from?",
    a: "From you. A companion browser extension can read the numbers off your own analytics page when you click it — nothing is scraped without you opening the page yourself. And there is always a thirty-second manual form. Whichever you pick, it takes about two days of numbers before the chart means anything.",
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
