import type {
  ConnectionCategory,
  ConnectionCategoryId,
  ConnectionPlan,
  LinkedInGoal,
  OnboardingAnswers,
} from "@/types";

/**
 * Source material for the connection strategy engine.
 *
 * Split from banks.ts to keep either file readable, and structured as
 * base + per-goal overlay rather than 20 hand-written entries: the *shape* of
 * "who to look for" barely changes between goals, but the reason to reach out
 * and what you open with change completely. Writing all 20 out longhand would
 * mean 20 places to edit when a search operator changes.
 */

interface CategoryBase {
  label: string;
  lookFor: string;
  /**
   * A LinkedIn search string the user runs themselves. Uses the platform's
   * own operators, which are only honoured inside quotes on the People tab —
   * bare keywords silently fall back to fuzzy matching.
   */
  searchQuery: string;
  /** Opening clause; the goal-specific intent line is appended to it. */
  opener: string;
}

const BASE: Record<ConnectionCategoryId, CategoryBase> = {
  industry_leaders: {
    label: "Industry leaders",
    lookFor:
      "People whose posts set the terms of the conversation in {industry} — the ones others quote and argue with, not necessarily the ones with the biggest follower counts.",
    searchQuery: '"{industry}" AND ("founder" OR "head of" OR "director" OR "principal")',
    // {industry}, not {topic}: the lowercased form mangles proper nouns —
    // "your posts on b2b saas onboarding" reads as a typo to the recipient.
    opener:
      "Hi {name} — your posts on {industry} have changed how I think about a couple of things, particularly the point about trade-offs.",
  },
  peers: {
    label: "Peers",
    lookFor:
      "People doing the same work as you in {industry}, at roughly the same stage. Same problems, no competition for the same chair.",
    searchQuery: '"{industry}" AND ("senior" OR "lead") NOT ("director" OR "VP")',
    opener:
      "Hi {name} — we are working on very similar problems in {industry} from different sides, and I would rather compare notes than not.",
  },
  clients_recruiters: {
    label: "People who can say yes",
    lookFor: "People with the authority to hire you, buy from you, or refer you onward in {industry}.",
    searchQuery: '"{industry}" AND ("hiring" OR "recruiting")',
    // Bare greeting: this lane's label changes completely between goals
    // (recruiters, clients, connectors, editors), so any shared opening
    // clause reads wrong for at least two of them. Each intent below is a
    // standalone sentence that carries the whole message.
    opener: "Hi {name} —",
  },
  content_creators: {
    label: "Active creators",
    lookFor:
      "People who post about {industry} consistently — weekly or better. They read comments, they reply, and their audience becomes your audience.",
    searchQuery: '"{industry}" AND ("writing about" OR "posting about" OR "creator")',
    opener:
      "Hi {name} — I have been commenting on your {industry} posts for a while and thought it was time to actually connect.",
  },
};

interface GoalOverlay {
  /** Overrides BASE.label when this goal names the group differently. */
  label?: string;
  why: string;
  /**
   * Appended to BASE.opener to form the full message. Deliberately avoids
   * naming the field again where the opener already did — composing two
   * halves that both fill {industry} produced messages that said "I work in
   * X ... I am focused on X roles" in the same breath. Only the
   * clients_recruiters opener is neutral, so only its intents carry it.
   */
  intent: string;
}

const OVERLAY: Record<LinkedInGoal, Record<ConnectionCategoryId, GoalOverlay>> = {
  get_hired: {
    industry_leaders: {
      why: "A referral from someone respected in {industry} skips the queue your application would otherwise sit in.",
      intent: "I am moving toward roles on that side of the work and wanted to be in your orbit before I need anything.",
    },
    peers: {
      why: "Peers hear about openings on their own teams weeks before those roles are posted anywhere public.",
      intent: "If you ever hear of something opening up on your side, I would appreciate the heads up.",
    },
    clients_recruiters: {
      label: "Recruiters and hiring managers",
      why: "They keep a mental shortlist long before a role is advertised. Being on it early costs one message.",
      intent:
        "I am focused on {industry} roles and wanted to connect ahead of any openings rather than only when one appears.",
    },
    content_creators: {
      why: "Commenting well on a widely-read post puts your name in front of exactly the people who hire in {industry}.",
      intent: "Yours is one of the few feeds where hiring in this field gets discussed honestly.",
    },
  },
  personal_brand: {
    industry_leaders: {
      why: "One substantive reply from someone established in {industry} does more for reach than a week of posting into silence.",
      intent: "I am writing more about this myself and would rather be in the same room as the people doing it well.",
    },
    peers: {
      why: "Peers are the people who will actually engage with your posts early, when engagement decides whether anyone sees them.",
      intent: "I am posting regularly now and would rather build that alongside people than at them.",
    },
    clients_recruiters: {
      label: "People who amplify",
      why: "Every audience has a handful of people whose share is worth a hundred likes. Find them before you need them.",
      intent: "I am building an audience around {industry} and your take on it is one I keep coming back to.",
    },
    content_creators: {
      why: "Creators reciprocate. Comment on their work consistently and yours starts appearing to their readers.",
      intent: "I write in the same space and would rather know the people doing it than circle them.",
    },
  },
  generate_leads: {
    industry_leaders: {
      why: "Leaders in {industry} do not buy from you, but their recommendation ends the evaluation before it starts.",
      intent: "I work on exactly the problem you were describing, from the delivery side.",
    },
    peers: {
      why: "Peers refer work they cannot take. That is the cheapest pipeline there is.",
      intent: "We seem to serve overlapping clients without competing, which usually makes for a useful connection.",
    },
    clients_recruiters: {
      label: "Potential clients",
      why: "The people with the budget and the problem. Everything else on this page is a route to them.",
      intent:
        "I help {industry} teams with this specific problem, and I am not going to pitch you in a connection request.",
    },
    content_creators: {
      why: "Their audience is your market, already gathered and already paying attention.",
      intent: "Your posts reach the exact people I work with, and I have learned from them.",
    },
  },
  network: {
    industry_leaders: {
      why: "Knowing who sets direction in {industry} tells you where the field is going before it gets there.",
      intent: "I am widening who I know deliberately rather than waiting until I need something.",
    },
    peers: {
      why: "This is the group that will still matter in ten years, when all of you have moved up.",
      intent: "We are at a similar point and I would rather know you now than later.",
    },
    clients_recruiters: {
      label: "Connectors",
      why: "Some people know everyone. One good connector is worth fifty ordinary connections.",
      intent: "You seem to know everyone worth knowing in {industry}, which is exactly why I am reaching out.",
    },
    content_creators: {
      why: "Creators run the informal meeting places of {industry} — their comment sections are where people actually meet.",
      intent: "Your posts are where half the interesting conversations in this field seem to happen.",
    },
  },
  thought_leadership: {
    industry_leaders: {
      why: "You cannot lead a conversation you are not in. These are the people currently holding it.",
      intent: "I am arguing for a particular position on it and would rather test that against people who disagree.",
    },
    peers: {
      why: "Ideas get sharper against people who know the detail well enough to push back properly.",
      intent: "I am working through an argument and you are close enough to the work to tell me where it breaks.",
    },
    clients_recruiters: {
      label: "Editors and organisers",
      why: "Conference organisers, newsletter editors and podcast hosts are how a position travels beyond your own followers.",
      intent: "I have been developing a specific argument about {industry} that I think would be useful to your audience.",
    },
    content_creators: {
      why: "A public disagreement with someone credible does more for a position than any amount of agreeing.",
      intent: "We seem to have landed on different conclusions, which is why I wanted to connect rather than not.",
    },
  },
};

export const CONNECTION_CATEGORY_ORDER: ConnectionCategoryId[] = [
  "industry_leaders",
  "peers",
  "clients_recruiters",
  "content_creators",
];

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

/**
 * Lives here rather than beside generateConnectionPlan so it stays free of
 * the provider import chain — that pulls in `server-only`, which makes the
 * mock impossible to exercise from a plain script.
 */
export function mockConnectionPlan(answers: OnboardingAnswers): ConnectionPlan {
  const industry = answers.industry || "your field";

  // {name} is left intact on purpose: it is a placeholder the user replaces
  // with the recipient's name, not one we fill.
  const vars = { industry, topic: industry.toLowerCase(), name: "{name}" };

  return {
    categories: CONNECTION_CATEGORY_ORDER.map((id) => {
      const base = BASE[id];
      const overlay = OVERLAY[answers.goal][id];

      return {
        id,
        label: overlay.label ?? base.label,
        lookFor: fill(base.lookFor, vars),
        why: fill(overlay.why, vars),
        searchQuery: fill(base.searchQuery, vars),
        message: fill(`${base.opener} ${overlay.intent}`, vars),
      } satisfies ConnectionCategory;
    }),
    generatedAt: new Date().toISOString(),
  };
}
