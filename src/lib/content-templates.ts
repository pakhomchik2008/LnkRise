/**
 * Post templates.
 *
 * Structure over prose: each one is a shape that reliably works, not a script
 * to copy. The fill-in version uses [square brackets] so an unfilled slot is
 * impossible to publish by accident — unlike {curly braces}, which look
 * deliberate enough that people leave them in.
 *
 * Ten are free; the rest are Pro (gated in the UI on PLAN_ACCESS.fullBrief).
 */

export type TemplateCategory =
  | "story"
  | "lesson"
  | "hot_take"
  | "list"
  | "question"
  | "case_study"
  | "behind_the_scenes"
  | "carousel_script";

export interface PostTemplate {
  id: string;
  category: TemplateCategory;
  name: string;
  /** What shape the post takes and why it holds attention. */
  structure: string[];
  /** A filled example, so the shape is legible before the user starts. */
  example: string;
  /** The same shape with the specifics removed. */
  skeleton: string;
  premium: boolean;
}

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  story: "Story",
  lesson: "Lesson learned",
  hot_take: "Hot take",
  list: "List",
  question: "Question",
  case_study: "Case study",
  behind_the_scenes: "Behind the scenes",
  carousel_script: "Carousel script",
};

export const POST_TEMPLATES: PostTemplate[] = [
  {
    id: "story-turning-point",
    category: "story",
    name: "The turning point",
    structure: [
      "Open at the moment it went wrong — no scene-setting.",
      "What you believed before that moment.",
      "What broke that belief.",
      "What you do differently now.",
      "Ask what changed the reader's mind.",
    ],
    example:
      "Two weeks before launch, our biggest customer asked to see the roadmap. I sent it.\n\nThey cancelled four days later.\n\nI had assumed transparency was always the right call. It isn't — not when the thing you are being transparent about is unfinished and the reader has no context for how software gets built.\n\nNow I share direction, not dates. Nobody has cancelled since.\n\nWhat is something you were sure was best practice until it cost you?",
    skeleton:
      "[The moment it went wrong, stated plainly]\n\n[The consequence, one line]\n\nI had assumed [the belief]. It isn't — not when [the condition that breaks it].\n\nNow I [what you changed]. [The result].\n\nWhat is something you were sure about until it cost you?",
    premium: false,
  },
  {
    id: "story-first-day",
    category: "story",
    name: "What nobody tells you",
    structure: [
      "Name the thing everyone gets wrong about your field.",
      "The version people expect.",
      "The version that is true.",
      "Why the gap exists.",
      "What you would tell someone starting now.",
    ],
    example:
      "Nobody warns you that most of platform engineering is saying no to your own ideas.\n\nThe job as advertised: design systems, pick tools, build the thing.\n\nThe job in practice: three of the four good ideas you have this quarter will make the platform harder to operate, and your value is knowing which three.\n\nThe gap exists because the interesting part is legible and the restraint is not.\n\nIf you are starting now: keep a list of the things you decided not to build. It is the better portfolio.",
    skeleton:
      "Nobody warns you that most of [field] is [the unglamorous truth].\n\nThe job as advertised: [expectation].\n\nThe job in practice: [reality, with a specific number or ratio].\n\nThe gap exists because [reason].\n\nIf you are starting now: [the one piece of advice].",
    premium: false,
  },
  {
    id: "lesson-expensive",
    category: "lesson",
    name: "The expensive lesson",
    structure: [
      "State the cost up front — time, money, or a person.",
      "The decision that caused it.",
      "Why it looked right at the time.",
      "The signal you missed.",
      "The rule you now follow.",
    ],
    example:
      "A migration I ran cost us six weeks we did not have.\n\nWe moved the database and the framework in the same change, because doing them separately meant maintaining two paths for a month.\n\nThat reasoning was correct. It was also irrelevant — when it broke, we could not tell which half broke it.\n\nThe signal I missed: nobody on the team could describe the rollback in one sentence.\n\nThe rule now: if the rollback needs a diagram, the change is two changes.",
    skeleton:
      "[The cost, stated first]\n\n[The decision]\n\nThat reasoning was correct. It was also [why it did not matter].\n\nThe signal I missed: [the warning sign].\n\nThe rule now: [the one-line rule].",
    premium: false,
  },
  {
    id: "lesson-unlearn",
    category: "lesson",
    name: "What I had to unlearn",
    structure: [
      "The advice everyone gave you.",
      "Why you followed it.",
      "Where it stopped working.",
      "What replaced it.",
    ],
    example:
      "Every senior engineer told me to write more documentation.\n\nSo I did — long, careful, thorough documents nobody opened.\n\nThe advice was not wrong, it was incomplete. Documentation is read when someone is stuck, not when they are curious. Long documents fail exactly then.\n\nWhat replaced it: one page per system, and the first line answers \"what do I do when this breaks at 3am\".\n\nThe long documents still exist. They are just not the first thing anyone finds.",
    skeleton:
      "Everyone told me to [common advice].\n\nSo I did — [what that looked like, and the disappointing result].\n\nThe advice was not wrong, it was incomplete. [The missing condition].\n\nWhat replaced it: [the specific alternative].\n\n[What happened to the original approach].",
    premium: false,
  },
  {
    id: "hot-take-disagree",
    category: "hot_take",
    name: "The respectful disagreement",
    structure: [
      "Name the popular position fairly — steelman it.",
      "Concede the part that is true.",
      "The case it does not survive.",
      "What you would do instead.",
      "Invite the counter-argument sincerely.",
    ],
    example:
      "The standard advice is to hire for potential over experience. It is good advice and I have seen it work.\n\nIt holds when you have someone senior with time to teach.\n\nIt collapses when you do not. Potential is a bet that someone will grow into the role, and growth needs a teacher. Hiring for potential onto a team with nobody free to mentor is not optimism, it is offloading the risk onto the person you just hired.\n\nWhat I do instead: hire for potential only when I can name who is teaching them, out loud, in the hiring meeting.\n\nTell me where this breaks — I have changed my mind on it once already.",
    skeleton:
      "The standard advice is [position]. It is good advice and [concede it honestly].\n\nIt holds when [the condition].\n\nIt collapses when [the case it fails]. [Why, in two or three sentences].\n\nWhat I do instead: [your rule].\n\nTell me where this breaks.",
    premium: false,
  },
  {
    id: "list-mistakes",
    category: "list",
    name: "Mistakes, with the fix",
    structure: [
      "State how many and who they are for.",
      "One line per mistake, one line per fix.",
      "Rank by cost, not by order of discovery.",
      "Close on the one that cost you most.",
    ],
    example:
      "Five mistakes I made in my first year of platform work, worst first.\n\n1. Building a paved road nobody asked for. Fix: find the team already doing it by hand, and pave that.\n\n2. Measuring adoption by signups. Fix: measure it by the second week of use.\n\n3. Optimising a build nobody was waiting on. Fix: ask what people do while it runs.\n\n4. One-size migrations. Fix: migrate the loudest team first, publicly.\n\n5. Documenting the happy path. Fix: document the failure.\n\nThe first one cost a quarter. The other four cost a week between them.",
    skeleton:
      "[Number] mistakes I made in [context], worst first.\n\n1. [Mistake]. Fix: [fix].\n\n2. [Mistake]. Fix: [fix].\n\n3. [Mistake]. Fix: [fix].\n\n[Close by naming which one actually cost you].",
    premium: false,
  },
  {
    id: "list-tools",
    category: "list",
    name: "What I actually use",
    structure: [
      "Reject the round-number listicle explicitly.",
      "Only tools you used this month.",
      "One line on what it replaced.",
      "Name what you dropped and why.",
    ],
    example:
      "Not a top-ten list. These are the four things I opened every day this month.\n\n— A plain text file for the day's plan. Replaced three project tools.\n— Ripgrep. Replaced clicking through the code host.\n— One dashboard with four numbers. Replaced a dashboard with forty.\n— A recurring 20-minute meeting with one person. Replaced most of my Slack.\n\nWhat I dropped: the note-taking app I had spent two years configuring. I was maintaining it more than using it.",
    skeleton:
      "Not a top-ten list. These are the [number] things I used every day this month.\n\n— [Tool]. Replaced [what it replaced].\n— [Tool]. Replaced [what it replaced].\n— [Tool]. Replaced [what it replaced].\n\nWhat I dropped: [the thing], because [reason].",
    premium: false,
  },
  {
    id: "question-genuine",
    category: "question",
    name: "The genuine question",
    structure: [
      "The problem, concretely enough to be answerable.",
      "What you already tried.",
      "Why the obvious answer does not fit.",
      "The specific question.",
    ],
    example:
      "How do you keep an on-call rotation fair when the team spans five time zones?\n\nWe tried following the sun — three-person shifts, each in one region. It works until someone leaves, and then one region is carrying two slots for months.\n\nThe obvious answer is to hire in the thin region, but hiring for on-call coverage is a bad reason to hire, and everyone knows it in the interview.\n\nSo: has anyone made this work without either burning one region out or hiring against the org chart?",
    skeleton:
      "[The question, stated plainly in one line]\n\nWe tried [approach]. It works until [where it fails].\n\nThe obvious answer is [obvious answer], but [why it does not fit].\n\nSo: [the specific question you want answered]?",
    premium: false,
  },
  {
    id: "case-study-numbers",
    category: "case_study",
    name: "Before and after",
    structure: [
      "The number before.",
      "The constraint you could not change.",
      "What you changed.",
      "The number after, and what it cost.",
      "What would not transfer to someone else's situation.",
    ],
    example:
      "Deploys took 40 minutes. Nobody deployed on Fridays.\n\nWe could not change the test suite — it was the only thing catching a class of bug that had burned us twice.\n\nWhat we changed: split the suite in two. The 6-minute half gates the deploy; the 34-minute half runs after, and pages if it fails.\n\nDeploys now take 8 minutes and Friday is the second-busiest deploy day. It cost us two weeks and one genuinely bad Saturday when the second half caught something after release.\n\nWhat would not transfer: this only works if you can actually roll back in minutes. If you cannot, keep the gate.",
    skeleton:
      "[The starting number, and the behaviour it caused]\n\nWe could not change [the constraint], because [reason].\n\nWhat we changed: [the change].\n\n[The new number], and it cost [the honest cost].\n\nWhat would not transfer: [the condition your solution depends on].",
    premium: false,
  },
  {
    id: "bts-process",
    category: "behind_the_scenes",
    name: "How this actually got made",
    structure: [
      "The polished result people saw.",
      "The unglamorous middle.",
      "The part you would cut if you did it again.",
      "What surprised you.",
    ],
    example:
      "The thing people saw: a one-page migration guide that got shared internally about forty times.\n\nWhat it took: three weeks, of which two were arguing about whether we needed the migration at all. The writing was an afternoon.\n\nWhat I would cut: the first week. I spent it building a comparison matrix nobody read, because I wanted the decision to look objective when it was always going to be a judgement call.\n\nWhat surprised me: the most-quoted line in the guide is the one admitting which part is going to be annoying. People trust a document that tells them where it hurts.",
    skeleton:
      "The thing people saw: [the polished output].\n\nWhat it took: [the real timeline, and where the time actually went].\n\nWhat I would cut: [the wasted part, and why you did it].\n\nWhat surprised me: [the unexpected lesson].",
    premium: false,
  },

  // --- Pro ----------------------------------------------------------------
  {
    id: "carousel-framework",
    category: "carousel_script",
    name: "Framework carousel",
    structure: [
      "Slide 1: the problem as a question.",
      "Slide 2: why the usual answer fails.",
      "Slides 3-7: one step per slide, verb first.",
      "Slide 8: what it looks like when it works.",
      "Slide 9: the ask.",
    ],
    example:
      "1 — Why do most platform migrations stall in month two?\n\n2 — Because the plan optimises for the end state, and month two is all middle.\n\n3 — Name the first team. One team, by name, not \"a pilot group\".\n\n4 — Ship the ugly path. Manual steps are fine if they are written down.\n\n5 — Measure the second week, not the first. Novelty is not adoption.\n\n6 — Publish the failures weekly. Silence reads as trouble.\n\n7 — Kill the old path on a date you announce early.\n\n8 — When it works: teams migrate themselves because waiting is now the harder option.\n\n9 — Which step is your migration stuck on?",
    skeleton:
      "1 — [Problem as a question]\n\n2 — [Why the usual answer fails]\n\n3 — [Step, verb first]\n\n4 — [Step, verb first]\n\n5 — [Step, verb first]\n\n6 — [Step, verb first]\n\n7 — [Step, verb first]\n\n8 — When it works: [the visible outcome]\n\n9 — [The ask]",
    premium: true,
  },
  {
    id: "hot-take-industry",
    category: "hot_take",
    name: "The thing the industry rewards",
    structure: [
      "Name a behaviour the field rewards.",
      "Why it is rational for the individual.",
      "Why it is bad for everyone together.",
      "What would have to change.",
    ],
    example:
      "Our field rewards the person who fixes the outage, not the person whose systems do not have one.\n\nThat is rational for the individual: the fix is visible, dated, and easy to put in a promotion packet. Absence of incidents is not a story anyone can tell.\n\nIt is bad collectively, because it prices reliability work below firefighting and then we act surprised that everyone is on fire.\n\nWhat would have to change: promotion packets that require naming what did not happen, and a manager willing to argue for it.",
    skeleton:
      "Our field rewards [the behaviour], not [the better behaviour].\n\nThat is rational for the individual: [why].\n\nIt is bad collectively, because [the systemic cost].\n\nWhat would have to change: [the specific mechanism].",
    premium: true,
  },
  {
    id: "case-study-failure",
    category: "case_study",
    name: "The one that failed",
    structure: [
      "What you set out to do.",
      "What you would have claimed at the halfway point.",
      "How it actually ended.",
      "The decision you would take back.",
      "What you kept.",
    ],
    example:
      "We set out to cut onboarding for new engineers from three weeks to one.\n\nAt the halfway point I would have told you it was working: the checklist was shorter and people said it felt faster.\n\nIt ended at three weeks. The checklist got shorter because we moved work out of it, not out of the process.\n\nThe decision I would take back: measuring the checklist instead of asking new hires when they first shipped something alone.\n\nWhat we kept: that question. It is now the only onboarding metric we track.",
    skeleton:
      "We set out to [goal].\n\nAt the halfway point I would have told you [the optimistic read].\n\nIt ended [the real outcome].\n\nThe decision I would take back: [the mistake].\n\nWhat we kept: [the one thing that survived].",
    premium: true,
  },
  {
    id: "story-someone-else",
    category: "story",
    name: "Credit where it is due",
    structure: [
      "Something you were praised for.",
      "Who actually made it possible.",
      "The specific thing they did.",
      "Why that kind of work stays invisible.",
    ],
    example:
      "I got the credit for a launch that went cleanly.\n\nIt went cleanly because a colleague spent the previous fortnight rewriting our rollback script — work nobody asked for, on a system nobody was complaining about.\n\nSpecifically: she made rollback a single command that anyone on call could run without reading anything. We used it once, at 11pm, and it took ninety seconds.\n\nThat kind of work is invisible because its success looks like nothing happening. Which is exactly why it needs someone to say it out loud.",
    skeleton:
      "I got the credit for [the visible win].\n\nIt worked because [person or role] [did the unglamorous thing].\n\nSpecifically: [the concrete detail].\n\nThat kind of work is invisible because [reason]. Which is why [what you are doing about it].",
    premium: true,
  },
  {
    id: "lesson-advice-to-self",
    category: "lesson",
    name: "Advice to yourself, dated",
    structure: [
      "Pick a specific point in your past, with the year.",
      "What you were worried about then.",
      "Which of those worries was justified.",
      "What you should have been worried about instead.",
    ],
    example:
      "To me, three years in.\n\nYou are worried you do not know enough of the stack. You are worried the senior people can tell.\n\nThe second one is fair — they can. It matters less than you think, because they are not measuring what you know, they are measuring whether you say when you do not know it.\n\nWhat you should be worried about instead: that you have not written anything down in eighteen months. The thing that eventually got you taken seriously was not knowing more. It was being the person whose reasoning other people could read.",
    skeleton:
      "To me, [time period] in.\n\nYou are worried about [worry one]. You are worried about [worry two].\n\n[Which was justified, and the nuance].\n\nWhat you should be worried about instead: [the real thing, and what it led to].",
    premium: true,
  },
];

export const FREE_TEMPLATES = POST_TEMPLATES.filter((template) => !template.premium);

export function templatesFor(unlocked: boolean): PostTemplate[] {
  return unlocked ? POST_TEMPLATES : POST_TEMPLATES.map(redactIfPremium);
}

/**
 * Premium templates keep their name and category — enough to see what is
 * behind the gate — but the structure, example and skeleton are the product
 * and are removed on the server rather than hidden in the client.
 */
function redactIfPremium(template: PostTemplate): PostTemplate {
  if (!template.premium) return template;
  return { ...template, structure: [], example: "", skeleton: "" };
}
