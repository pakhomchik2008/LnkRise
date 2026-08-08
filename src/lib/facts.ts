import type { LinkedInGoal } from "@/types";

/**
 * Questions that pull a specific fact out of someone.
 *
 * Every one of these is designed to be unanswerable in the abstract. "What is
 * your expertise" produces a category; "what did you get wrong that took a
 * quarter to fix" produces a story with a date, a cost and a decision in it —
 * the material a post can actually be built from.
 *
 * The questions are deliberately uncomfortable in places. Failures and
 * numbers are what make a post unrepeatable by anyone else; comfortable
 * questions produce the generic output this whole module exists to fix.
 */

export type FactKind = "failure" | "number" | "incident" | "opinion_change" | "lesson" | "credential";

export const FACT_KIND_LABELS: Record<FactKind, string> = {
  failure: "Something that failed",
  number: "A number",
  incident: "A specific moment",
  opinion_change: "A mind changed",
  lesson: "Something learned the hard way",
  credential: "Proof you did the work",
};

export const FACT_KIND_HINTS: Record<FactKind, string> = {
  failure:
    "Projects that died, decisions that cost you, things you shipped and regretted. These make the best posts and are the hardest to write.",
  number:
    "Anything measurable you were part of: users, revenue, latency, headcount, hours saved, percentage moved. A number is the fastest way to be believed.",
  incident:
    "One conversation, one meeting, one bug, one rejection. Dated and concrete, not a summary of a period.",
  opinion_change:
    "Something you were sure about and no longer are. What changed your mind, specifically.",
  lesson: "Advice you would give that you had to pay for yourself.",
  credential:
    "Things you built, shipped, ran or were responsible for. Not job titles — the actual work.",
};

export interface FactQuestion {
  kind: FactKind;
  /** {industry} is filled with the user's field, exactly as they typed it. */
  question: string;
}

/**
 * Asked of everyone. Ordered roughly by how much they yield: the opening
 * questions are the ones most likely to produce something usable on the first
 * try, so a user who answers only three still has material worth generating
 * from.
 */
const UNIVERSAL: FactQuestion[] = [
  {
    kind: "failure",
    question:
      "Tell me about something in {industry} you worked on that did not work out. What specifically broke, and what did it cost?",
  },
  {
    kind: "number",
    question:
      "What is a number from your own work you could state out loud? Users, revenue, latency, team size, hours saved — anything you personally moved.",
  },
  {
    kind: "opinion_change",
    question:
      "What did you believe about {industry} two years ago that you no longer believe? What changed your mind?",
  },
  {
    kind: "incident",
    question:
      "Describe one specific moment at work that stuck with you — a conversation, a decision, a thing that went wrong at the worst time.",
  },
  {
    kind: "credential",
    question:
      "What have you actually built, shipped or run? Name the thing, not the job title.",
  },
  {
    kind: "lesson",
    question:
      "What advice about {industry} do you give people, that you had to learn the expensive way?",
  },
  {
    kind: "failure",
    question:
      "What is something you shipped that you would build completely differently now, and why?",
  },
  {
    kind: "incident",
    question:
      "When were you most out of your depth at work? What did you do about it?",
  },
  {
    kind: "number",
    question:
      "What is the most surprising number you have seen in your own data or metrics? Why was it surprising?",
  },
  {
    kind: "opinion_change",
    question:
      "What does most of {industry} agree on that you think is wrong? What makes you think so?",
  },
];

/** Extra questions that only make sense for a particular goal. */
const BY_GOAL: Record<LinkedInGoal, FactQuestion[]> = {
  get_hired: [
    {
      kind: "incident",
      question:
        "What is the hardest interview question you have been asked, and what did you actually answer?",
    },
    {
      kind: "credential",
      question:
        "What is a problem you solved that the team could not solve without you? What did you know that they did not?",
    },
    {
      kind: "failure",
      question: "What is a role or offer you turned down, or lost? What did that teach you?",
    },
  ],
  personal_brand: [
    {
      kind: "opinion_change",
      question:
        "What do you find yourself explaining over and over to people in {industry}? Why does it keep coming up?",
    },
    {
      kind: "incident",
      question:
        "When did someone in {industry} disagree with you publicly? What was the argument, and who was right?",
    },
    {
      kind: "lesson",
      question: "What do you know now that would have saved you a year at the start?",
    },
  ],
  generate_leads: [
    {
      kind: "number",
      question:
        "What is a result you produced for a client or a team? The before number and the after number.",
    },
    {
      kind: "failure",
      question:
        "Tell me about a client engagement that went badly. What did you get wrong at the start?",
    },
    {
      kind: "incident",
      question:
        "What is the objection you hear most often from prospects, and what is your honest answer to it?",
    },
  ],
  network: [
    {
      kind: "incident",
      question:
        "Who in {industry} has changed how you work, and what specifically did they do or say?",
    },
    {
      kind: "lesson",
      question:
        "What is something you only learned by talking to someone, that you could not have read?",
    },
    {
      kind: "credential",
      question: "What are you unusually well placed to help someone else with?",
    },
  ],
  thought_leadership: [
    {
      kind: "opinion_change",
      question:
        "What is the argument about {industry} you want to be known for? State it as a claim someone could disagree with.",
    },
    {
      kind: "incident",
      question: "What evidence from your own work supports that argument? Be specific.",
    },
    {
      kind: "failure",
      question:
        "What is the strongest case against your position? Where does your argument genuinely struggle?",
    },
  ],
};

function fill(template: string, industry: string): string {
  return template.replace(/\{industry\}/g, industry || "your field");
}

/**
 * The next questions to put in front of the user, skipping anything they have
 * already answered.
 *
 * Matching on the question text rather than an id: questions are content, and
 * an edited wording should read as a new question rather than silently
 * inheriting an old answer.
 */
export function nextQuestions(
  goal: LinkedInGoal,
  industry: string,
  alreadyAsked: string[],
  count = 3,
): FactQuestion[] {
  const asked = new Set(alreadyAsked);
  const pool = [...UNIVERSAL, ...BY_GOAL[goal]];

  return pool
    .map((entry) => ({ ...entry, question: fill(entry.question, industry) }))
    .filter((entry) => !asked.has(entry.question))
    .slice(0, count);
}

/** Every question for a goal, for the "add a fact" picker. */
export function allQuestions(goal: LinkedInGoal, industry: string): FactQuestion[] {
  return [...UNIVERSAL, ...BY_GOAL[goal]].map((entry) => ({
    ...entry,
    question: fill(entry.question, industry),
  }));
}

/**
 * How much material there is to write from.
 *
 * The thresholds are judgement, not measurement: below three facts a
 * generator is still mostly working from the industry string, and the UI says
 * so rather than quietly producing a template.
 */
export function factCoverage(count: number): { level: "none" | "thin" | "workable" | "good"; note: string } {
  if (count === 0) {
    return {
      level: "none",
      note: "We know your field and your goal, and nothing else about you. Anything generated now is a template — it could have been written for anyone in your industry.",
    };
  }
  if (count < 3) {
    return {
      level: "thin",
      note: "Enough to make drafts less generic, not enough to make them yours. Three or four more and posts start containing things only you could say.",
    };
  }
  if (count < 8) {
    return {
      level: "workable",
      note: "Drafts can now be built around something specific. Keep adding as things happen — the bank is most useful when it is bigger than your memory.",
    };
  }
  return {
    level: "good",
    note: "Plenty to draw on. Posts can rotate through different material instead of returning to the same story.",
  };
}
