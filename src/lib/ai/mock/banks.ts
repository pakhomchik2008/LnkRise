import type { LinkedInGoal } from "@/types";

/**
 * Source material for the mock engine.
 *
 * Everything here is written as real coaching advice, not filler — the app has
 * to be genuinely usable before any API key exists, and this content is what a
 * first-time user actually reads on day one.
 */

export interface GoalProfile {
  label: string;
  focusLine: string;
  postAngles: string[];
  ctas: string[];
  connectAudiences: { audience: string; why: string; searchQuery: string; opener: string }[];
  commentAngles: { topic: string; why: string; starters: string[] }[];
  weekThemes: { theme: string; focus: string; milestones: string[] }[];
}

const shared = {
  hooks: [
    "Most {industry} advice assumes you already have the thing it is telling you how to get.",
    "I spent two years doing {topic} the slow way. Here is what I would tell myself on day one.",
    "The best {industry} person I know does one thing differently — and it is not the thing you would guess.",
    "Nobody warns you that the hardest part of {topic} is not the work. It is the waiting.",
    "A hiring manager told me the quiet reason most {industry} candidates get passed over.",
    "There is a version of {topic} that takes ten minutes and a version that takes ten weeks. Same outcome.",
  ],
};

export const GOAL_PROFILES: Record<LinkedInGoal, GoalProfile> = {
  get_hired: {
    label: "Get hired",
    focusLine: "Make it obvious what you do and who should hire you for it.",
    postAngles: [
      "A problem you solved in {industry} and the reasoning behind the fix",
      "What you look for when you evaluate {industry} work, and why",
      "The gap between how {industry} roles are described and what the job actually is",
      "A tool or process you changed your mind about",
    ],
    ctas: [
      "If you are hiring in {industry}, my inbox is open.",
      "Curious how others handle this — what does your team do?",
      "Happy to go deeper on any part of this if it is useful.",
    ],
    connectAudiences: [
      {
        audience: "Hiring managers on teams you would want to join",
        why: "They decide, and they see far fewer thoughtful messages than recruiters do.",
        searchQuery: '"{industry}" AND ("engineering manager" OR "head of" OR "director")',
        opener:
          "Hi {name} — I have been following how your team approaches {industry} work. I am moving toward roles like the ones you hire for and would value being connected.",
      },
      {
        audience: "In-house recruiters in your target companies",
        why: "They keep a mental shortlist long before a role is posted publicly.",
        searchQuery: '"technical recruiter" AND "{industry}"',
        opener:
          "Hi {name} — I am focused on {industry} roles and wanted to connect ahead of any openings rather than only when one appears.",
      },
      {
        audience: "People one step ahead of you in the same role",
        why: "They know which teams are actually good to work on, and they refer.",
        searchQuery: '"senior {industry}" -recruiter',
        opener:
          "Hi {name} — we work in the same corner of {industry} and I have found your posts genuinely useful. Would like to stay connected.",
      },
    ],
    commentAngles: [
      {
        topic: "Hiring posts and 'we are growing' announcements in your field",
        why: "A specific comment on a hiring post reaches exactly the people deciding who to interview.",
        starters: [
          "The part about {topic} matches what I have seen — the failure mode is usually hiring for the role on paper instead of the gap the team actually has right now.",
          "Worth adding: teams that get this right tend to write the post around a real problem, not a wishlist of tools.",
        ],
      },
      {
        topic: "Posts where someone describes a hard technical or process problem",
        why: "Answering well is a live demonstration of how you think, which no résumé line achieves.",
        starters: [
          "We hit this exact problem last year. What worked was breaking it into a piece we could ship and measure in a week, not solving it all at once.",
          "One thing that is easy to miss here: the process usually breaks a step earlier than people think — worth checking what happens right before the part everyone blames.",
        ],
      },
      {
        topic: "Career-transition stories in {industry}",
        why: "The comment sections are full of people at your stage, and of people who hire them.",
        starters: [
          "The bit about {topic} is underrated — most people underestimate how much of the old skill set actually transfers.",
          "This matches my own path, with one caveat: the hard part was not the skills, it was getting anyone to take the transition seriously.",
        ],
      },
    ],
    weekThemes: [
      {
        theme: "Make the profile answer one question",
        focus: "Someone should know what role to hire you for within five seconds.",
        milestones: [
          "Rewrite the headline as role + specialism, not job title",
          "Rewrite the About section to open with the problem you solve",
          "Add three concrete outcomes to your current role",
        ],
      },
      {
        theme: "Be visible where hiring happens",
        focus: "Comment before you post. Volume of thoughtful replies beats volume of posts.",
        milestones: [
          "Comment on five posts from people who hire in your field",
          "Publish your first post: a problem you solved",
          "Send ten connection requests with a real first line",
        ],
      },
      {
        theme: "Show the work",
        focus: "Two posts that demonstrate judgment, not just enthusiasm.",
        milestones: [
          "Publish a post explaining a decision and its tradeoff",
          "Reply to every comment you receive within a day",
          "Connect with five people at companies on your shortlist",
        ],
      },
      {
        theme: "Convert attention into conversations",
        focus: "Turn profile views into calls.",
        milestones: [
          "Message three warm connections about their team",
          "Review which post drew profile views and write a second like it",
          "Update the featured section with your best-performing post",
        ],
      },
    ],
  },

  personal_brand: {
    label: "Build a personal brand",
    focusLine: "Pick one lane and be repetitive about it until people associate it with you.",
    postAngles: [
      "The opinion about {industry} you would defend in a room of skeptics",
      "A thing everyone in {industry} does that you have stopped doing",
      "What you were wrong about a year ago in {topic}",
      "The unglamorous work behind a result people admire",
    ],
    ctas: [
      "Curious whether this holds outside my corner of {industry}.",
      "Tell me where this breaks down for you.",
      "If this was useful, I write about {industry} most weeks.",
    ],
    connectAudiences: [
      {
        audience: "Creators posting consistently in your niche",
        why: "Their audience is your audience, and they reciprocate engagement.",
        searchQuery: '"{industry}" AND ("creator" OR "writes about" OR "newsletter")',
        opener:
          "Hi {name} — I have been reading your posts on {industry} for a while and write in the same space. Would like to follow along more closely.",
      },
      {
        audience: "Practitioners with strong opinions and small followings",
        why: "They engage properly rather than dropping one-word comments, which is what actually moves reach.",
        searchQuery: '"{industry}" AND "opinion"',
        opener:
          "Hi {name} — your take on {topic} was the first thing I have read on it that did not repeat the usual line. Connecting.",
      },
      {
        audience: "Event organisers and podcast hosts in {industry}",
        why: "A brand becomes real the first time someone else puts you in front of their audience.",
        searchQuery: '"{industry}" AND ("host" OR "organizer" OR "curator")',
        opener:
          "Hi {name} — I write about {industry} and have been following what you put together. Would like to be connected.",
      },
    ],
    commentAngles: [
      {
        topic: "Posts by the three or four people who define the conversation in {industry}",
        why: "Being consistently useful in the same comment sections is how a name becomes familiar.",
        starters: [
          "Agreed on the main point. The part I would push on is how well this holds once the team is past ten people.",
          "This is right, and it gets more true the further you get from the ideal case everyone uses as the example.",
        ],
      },
      {
        topic: "Threads where the consensus answer is wrong",
        why: "A well-argued dissent travels much further than agreement.",
        starters: [
          "I read this differently. In practice the thing that breaks first is usually the assumption nobody states out loud.",
          "The usual answer here is {topic}, but that assumes a starting point most teams do not actually have.",
        ],
      },
      {
        topic: "Beginner questions in your niche",
        why: "Answering them well is the cheapest authority signal there is.",
        starters: [
          "Short version: start smaller than feels reasonable, then let the scope grow with the evidence.",
          "The thing nobody tells you at this stage is that the first version is supposed to be wrong — that is what it is for.",
        ],
      },
    ],
    weekThemes: [
      {
        theme: "Choose the lane",
        focus: "Narrow the topic until it feels uncomfortably specific.",
        milestones: [
          "Write down the one sentence you want to be known for",
          "Rewrite the headline around that sentence",
          "List ten post ideas that all sit inside it",
        ],
      },
      {
        theme: "Establish the rhythm",
        focus: "Two posts this week, both on the same theme.",
        milestones: [
          "Publish an opinion post",
          "Publish a lessons-learned post",
          "Comment daily on the same five accounts",
        ],
      },
      {
        theme: "Go deeper, not wider",
        focus: "Take the best-performing idea and write the version with more detail.",
        milestones: [
          "Publish a long-form breakdown",
          "Reply to every comment",
          "Ask one question post to your audience",
        ],
      },
      {
        theme: "Consolidate",
        focus: "Make the profile match the reputation you have started building.",
        milestones: [
          "Pin your best post to the featured section",
          "Rewrite the About section in your posting voice",
          "Plan next month's four themes",
        ],
      },
    ],
  },

  generate_leads: {
    label: "Generate leads",
    focusLine: "Write for the person with the problem, not for your peers.",
    postAngles: [
      "The symptom your clients describe before they know what the real problem is",
      "A before-and-after from work in {industry}, with the numbers",
      "Why the obvious fix for {topic} usually fails",
      "A question you ask every new client in the first ten minutes",
    ],
    ctas: [
      "If this sounds like your situation, my DMs are open.",
      "I put the full breakdown in a short doc — comment and I will send it.",
      "Happy to look at your setup and tell you if it is worth fixing.",
    ],
    connectAudiences: [
      {
        audience: "Decision-makers with the budget for what you sell",
        why: "Selling to someone who has to ask permission adds months.",
        searchQuery: '("head of" OR "VP" OR "founder") AND "{industry}"',
        opener:
          "Hi {name} — I work with {industry} teams on the problem you described in your last post. No pitch; would like to be connected.",
      },
      {
        audience: "Operators one level below the buyer",
        why: "They feel the problem daily and are the ones who name you internally.",
        searchQuery: '"{industry}" AND ("manager" OR "lead")',
        opener:
          "Hi {name} — we work on the same problem from different sides. Would value staying connected.",
      },
      {
        audience: "Adjacent service providers who are not competitors",
        why: "Referral partners produce better-qualified leads than any post.",
        searchQuery: '"{industry}" AND ("consultant" OR "agency" OR "advisor")',
        opener:
          "Hi {name} — we serve the same clients from adjacent angles. Worth being connected in case referrals make sense.",
      },
    ],
    commentAngles: [
      {
        topic: "Posts where someone describes the problem you solve",
        why: "The most direct path to a conversation that does not feel like outreach.",
        starters: [
          "We see this a lot. The usual root cause is a process that was fine at half the volume and never got revisited.",
          "Before changing anything, it is worth checking whether the bottleneck is actually where it looks like it is — it usually is not.",
        ],
      },
      {
        topic: "Industry news that changes what your clients have to do",
        why: "Being early with a practical read positions you as the person to call.",
        starters: [
          "The practical effect for most {industry} teams is more work short term and less risk long term — worth planning for both.",
          "Worth flagging what this does and does not change: the rules moved, but the underlying problem did not.",
        ],
      },
      {
        topic: "Posts from your target buyers, on anything",
        why: "Familiarity before outreach roughly doubles reply rates.",
        starters: [
          "This matches what we see across {industry} right now — the timing lines up with what our clients describe.",
          "The second-order effect people miss here is that fixing the visible problem often exposes a second one underneath it.",
        ],
      },
    ],
    weekThemes: [
      {
        theme: "Say who you help, out loud",
        focus: "The profile should read as an offer, not a résumé.",
        milestones: [
          "Rewrite the headline as who you help and with what",
          "Add one proof point with a number",
          "Add a clear way to start a conversation",
        ],
      },
      {
        theme: "Build the warm list",
        focus: "Engage before you ever pitch.",
        milestones: [
          "Identify twenty target accounts",
          "Comment on posts from ten of them",
          "Publish one post that names the problem exactly",
        ],
      },
      {
        theme: "Show proof",
        focus: "Case-shaped content beats claims.",
        milestones: [
          "Publish a before-and-after post",
          "Send five personalised connection requests",
          "Follow up with anyone who engaged twice",
        ],
      },
      {
        theme: "Open conversations",
        focus: "Move engaged contacts to a call.",
        milestones: [
          "Message ten warm contacts without a pitch",
          "Publish a post that answers a common objection",
          "Review which post produced profile views from buyers",
        ],
      },
    ],
  },

  network: {
    label: "Network",
    focusLine: "Be useful to specific people before you need anything.",
    postAngles: [
      "Something you learned from someone else in {industry} this month",
      "A question you genuinely do not have the answer to",
      "A resource in {topic} that deserves more attention",
      "What you changed after a conversation with a peer",
    ],
    ctas: [
      "Who else should I be reading on this?",
      "Genuinely curious how this works on your team.",
      "Always up for a conversation with people working on this.",
    ],
    connectAudiences: [
      {
        audience: "People whose work you have actually used or read",
        why: "A specific reference makes the request almost impossible to ignore.",
        searchQuery: '"{industry}" AND "writes"',
        opener:
          "Hi {name} — your piece on {topic} changed how I approach it. Wanted to say so and connect.",
      },
      {
        audience: "Peers at the same career stage in other companies",
        why: "This is the group that will still be useful to you in five years.",
        searchQuery: '"{industry}" AND "{role}"',
        opener:
          "Hi {name} — we do similar work at different companies. Would like to compare notes occasionally.",
      },
      {
        audience: "People you met at events but never followed up with",
        why: "The cheapest network growth available, and almost everyone skips it.",
        searchQuery: "",
        opener:
          "Hi {name} — we spoke briefly at {event}. Following up properly this time.",
      },
    ],
    commentAngles: [
      {
        topic: "Posts from people you want to know",
        why: "Three good comments make a later connection request feel like a continuation.",
        starters: [
          "This lines up with something I ran into recently — good to see it is not just us.",
          "Question on the last point: did that hold once the team got bigger, or did it need adjusting?",
        ],
      },
      {
        topic: "Open questions in your field",
        why: "The people who answer well are exactly the people worth knowing.",
        starters: [
          "Partial answer from my side: it depends more on team size than most people assume.",
          "Depends on scale, in my experience — small teams and large ones need almost opposite answers here.",
        ],
      },
      {
        topic: "Posts announcing new roles or launches",
        why: "Congratulations that reference something specific get replies.",
        starters: [
          "Congratulations — the {topic} part especially, that is the harder half to get right.",
          "Well deserved. Curious what the first ninety days end up looking like.",
        ],
      },
    ],
    weekThemes: [
      {
        theme: "Map the network you want",
        focus: "Twenty names beats a thousand connections.",
        milestones: [
          "List twenty people worth knowing in {industry}",
          "Follow all of them",
          "Comment on five of their posts",
        ],
      },
      {
        theme: "Give first",
        focus: "Be visibly useful before asking for anything.",
        milestones: [
          "Share someone else's work with your own commentary",
          "Answer three questions properly",
          "Send five connection requests referencing specific work",
        ],
      },
      {
        theme: "Start conversations",
        focus: "Move from comments to messages.",
        milestones: [
          "Message three new connections with a real question",
          "Publish a post asking for input",
          "Reply to everyone who engages",
        ],
      },
      {
        theme: "Keep it warm",
        focus: "A network decays without maintenance.",
        milestones: [
          "Re-engage five older connections",
          "Introduce two people to each other",
          "Set a weekly rhythm you can sustain",
        ],
      },
    ],
  },

  thought_leadership: {
    label: "Thought leadership",
    focusLine: "Say the thing others in {industry} believe but will not write down.",
    postAngles: [
      "The consensus position in {industry} that you think is wrong",
      "A framework you use for {topic} that you have never seen written up",
      "What the data in your field actually shows versus what people repeat",
      "A prediction about {industry} you are willing to be judged on",
    ],
    ctas: [
      "Tell me where this is wrong — genuinely.",
      "If you disagree, I want to hear the strongest version of it.",
      "More on this over the next few weeks.",
    ],
    connectAudiences: [
      {
        audience: "The people currently shaping the debate in {industry}",
        why: "Ideas spread through the people already trusted to have them.",
        searchQuery: '"{industry}" AND ("author" OR "keynote" OR "research")',
        opener:
          "Hi {name} — I have been arguing the other side of your {topic} position for a while and would rather do it in public with you than around you.",
      },
      {
        audience: "Researchers and analysts covering your field",
        why: "They supply the evidence that turns an opinion into a position.",
        searchQuery: '"{industry}" AND ("analyst" OR "researcher")',
        opener:
          "Hi {name} — your work on {topic} is the empirical backing for something I write about often. Connecting.",
      },
      {
        audience: "Editors and curators in {industry} publications",
        why: "One syndicated piece outruns six months of posting.",
        searchQuery: '"{industry}" AND ("editor" OR "publication")',
        opener:
          "Hi {name} — I write regularly about {topic} and would like to be on your radar for contributions.",
      },
    ],
    commentAngles: [
      {
        topic: "Widely shared posts you partly disagree with",
        why: "Precise disagreement in a large comment section is the fastest route to being read.",
        starters: [
          "Strong post, and I want to argue with one part of it: the conclusion does not follow as cleanly as the setup suggests.",
          "This is true up to a point. Past that point it starts working against the people it is meant to help.",
        ],
      },
      {
        topic: "New research or data drops in {industry}",
        why: "Being first with a considered interpretation is a durable position.",
        starters: [
          "The headline number is less interesting than the method behind it — worth reading past the summary.",
          "Worth reading the methodology before drawing the obvious conclusion — the sample here is doing a lot of the work.",
        ],
      },
      {
        topic: "Posts repeating a claim you believe is unfounded",
        why: "Correcting the record politely and repeatedly is what the role consists of.",
        starters: [
          "This gets repeated a lot. The evidence behind it is thinner than the confidence people say it with.",
          "Small correction, offered in good faith: the original data does not actually support this reading.",
        ],
      },
    ],
    weekThemes: [
      {
        theme: "State the position",
        focus: "Write down the claim you are actually making.",
        milestones: [
          "Draft the one-paragraph version of your thesis",
          "Rewrite the About section around it",
          "Publish the thesis post",
        ],
      },
      {
        theme: "Defend it",
        focus: "Engage seriously with the strongest objections.",
        milestones: [
          "Reply substantively to every disagreement",
          "Publish a post addressing the best counterargument",
          "Connect with three people who pushed back well",
        ],
      },
      {
        theme: "Bring evidence",
        focus: "Move from assertion to demonstration.",
        milestones: [
          "Publish a post built on data or a worked example",
          "Cite two other people's work and add to it",
          "Ask a specific question of your audience",
        ],
      },
      {
        theme: "Extend the reach",
        focus: "Get the argument in front of audiences that are not yours.",
        milestones: [
          "Comment on three high-traffic posts in adjacent fields",
          "Pitch one publication or podcast",
          "Plan the next month's argument",
        ],
      },
    ],
  },
};

export const HOOK_TEMPLATES = shared.hooks;

export const OPTIMIZATION_TIPS = [
  {
    title: "Rewrite your headline as a claim, not a job title",
    detail:
      "\"Senior Analyst at Acme\" tells a reader nothing they cannot see elsewhere. \"I help operations teams find the 20% of reporting that actually changes decisions\" gives them a reason to keep reading.",
  },
  {
    title: "Fix the first two lines of your About section",
    detail:
      "Everything after line two is hidden behind 'see more'. Most people spend those two lines on a wind-up. Open with the problem you solve for a specific person.",
  },
  {
    title: "Add one number to your current role",
    detail:
      "Not a vanity metric — a number that shows scope. Team size, budget, users served, cycle time. It converts a description into evidence.",
  },
  {
    title: "Reorder your skills so the top three match your goal",
    detail:
      "The first three are the only ones most people read, and they feed search. If they describe the job you had rather than the one you want, they are working against you.",
  },
  {
    title: "Put your best post in the featured section",
    detail:
      "A profile visitor who arrives from a comment has one question: is this person worth following? Featured answers it without them having to scroll.",
  },
  {
    title: "Replace the stock banner image",
    detail:
      "The default gradient is the clearest signal that a profile is unmaintained. Even a plain colour with one line of text outperforms it.",
  },
  {
    title: "Turn on creator mode and pick your five topics",
    detail:
      "It changes how your profile presents follow versus connect, and the topics feed distribution. Five minutes, and most people never do it.",
  },
];
