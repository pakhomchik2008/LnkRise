import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed content.
 *
 * The blog posts are real writing and can ship as-is. The case studies are
 * clearly labelled samples — invented results presented as real customers
 * would be misleading, so each one says what it is in its own copy. Replace
 * them with permissioned, verifiable stories before launch.
 */

const posts = [
  {
    slug: "the-first-two-lines",
    title: "The first two lines are the whole post",
    excerpt:
      "Everything after line two is hidden behind a 'see more' link most people never click. Here is how to write the part they actually read.",
    tags: ["writing", "engagement"],
    content: `Almost every post you write is judged on about eighteen words. That is roughly what fits above the cut-off before the feed collapses the rest behind "see more". If those words do not earn the expansion, nothing else in the post matters — not the structure, not the ending, not the hours you spent on the middle.

## What loses people

Three openings fail reliably. The wind-up: "I have been thinking a lot about leadership lately." The credential: "As someone with twelve years in operations." And the announcement: "Excited to share that…" All three ask the reader to trust that something good is coming. Nobody has agreed to that.

## What works instead

Open on the sharpest specific thing you have. A number that sounds wrong. A sentence someone actually said to you. A claim you are prepared to defend. If your post has a good line in the middle, that line is your opening — cut everything above it and see whether you miss it.

The test is simple: read only the first two lines aloud. If a stranger would not want the third, you do not have a hook yet. You have a warm-up, and warm-ups belong in your drafts folder.

## The uncomfortable part

This usually means deleting your favourite paragraph. The considered, balanced setup that shows you thought about the problem properly is exactly the thing that stops people from reading about the problem. Write it if you need it to find the point — then remove it once you have.`,
  },
  {
    slug: "comments-beat-posts",
    title: "Comments beat posts for the first ninety days",
    excerpt:
      "If nobody knows you yet, posting into an empty room is the slowest available strategy. There is a faster one, and almost nobody plans for it.",
    tags: ["strategy", "growth"],
    content: `The standard advice is to post consistently and wait. It works, eventually. It is also the slowest path available to someone with no audience, because a post reaches roughly the people who already follow you — and at the start that is a handful of former colleagues.

## Where the audience already is

Comment sections on posts from people in your field are full of exactly the people you want to reach, and they are already paying attention. A genuinely useful comment on a post with two hundred engaged readers does more for you than a good post seen by eleven people.

## What counts as useful

Not "great post". Not "so true". A useful comment does one of three things: it adds a specific case the original post did not cover, it disagrees precisely and explains why, or it answers a question someone else asked underneath. All three require you to have read the thing properly, which is the entire barrier — and the reason so few people do it.

## The realistic cadence

Five comments a day, on posts from the same twenty or thirty accounts, for a month. That is fifteen minutes. By week three your name is familiar in those threads, and a connection request from you reads as a continuation rather than an intrusion.

Then start posting. You will be writing into a room that knows who you are, and the difference in response is not subtle.`,
  },
  {
    slug: "profile-headline-is-a-claim",
    title: "Your headline is a claim, not a job title",
    excerpt:
      "The field directly under your name is the most-read line you control, and most people fill it with information that is already visible elsewhere.",
    tags: ["profile", "positioning"],
    content: `Your job title appears in your experience section. Your company appears there too, with a logo. So when your headline reads "Senior Analyst at Acme", you have spent the single most-read line on your profile repeating something the reader can already see.

## What the line is for

A headline should answer one question: why should this specific person keep reading? That means naming the problem you solve and, ideally, who you solve it for. "I help operations teams find the twenty per cent of their reporting that changes a decision" is a claim. It can be agreed with or argued against, which is what makes it worth reading.

## The specificity trade

Narrowing feels like losing opportunities. In practice the opposite happens: a headline that describes everyone gets remembered by no one. The person who wants a generalist will still find you. The person with the exact problem you are best at will now recognise it.

## Two mechanical notes

Keep it under about 180 characters or it truncates in search results, where a large share of profile views begin. And put your key term early — search weighting favours the front of the field, and so do human readers scanning a list.

Rewrite it once a quarter. If it still describes the job you had rather than the one you want, it is working against you.`,
  },
  {
    slug: "what-to-measure",
    title: "Four numbers worth tracking, and the ones to ignore",
    excerpt:
      "Most engagement metrics tell you how a single post did. Very few tell you whether any of this is working. These are the ones that do.",
    tags: ["analytics", "strategy"],
    content: `Likes are the most visible number and close to the least useful. They tell you a post was agreeable. They do not tell you whether the right people saw it, whether anyone remembered it, or whether it moved you closer to whatever you are actually trying to do.

## The four that matter

Profile views: how many people were interested enough to check who you are. This is the closest thing to a genuine signal of curiosity, and it is the one that best predicts conversations.

Post impressions: how far your writing travelled. Read it against your posting frequency — impressions that rise while you post less mean your work is being shared rather than merely served.

Follower growth: are you accumulating an audience or renting attention? Steady growth after posts is the difference between a piece that resonated and one that merely circulated.

Connection quality: not the count. What proportion of new connections match the audience you named as your target? A thousand connections in the wrong field is a worse position than eighty in the right one.

## Why you have to log them by hand

Personal analytics are not available through any public API. Every tool that claims to pull them automatically is either scraping — which violates the terms and gets accounts restricted — or estimating and calling it data. Thirty seconds a day of manual logging is unglamorous and it is the honest version.

## What to do with them

Look weekly, not daily. Daily numbers are noise. Weekly numbers show direction, and direction is the only thing you can act on.`,
  },
  {
    slug: "consistency-over-volume",
    title: "Why the person posting once a week is beating you",
    excerpt:
      "Volume feels like effort. Consistency is what actually compounds — and they are not the same thing.",
    tags: ["strategy", "habits"],
    content: `A common pattern: someone decides to take this seriously, posts every day for two weeks, gets modest results, and stops. Six months later they try again. Meanwhile someone else posts once a week, every week, and is now the person their field thinks of first.

## What compounds

Recognition. The second time someone sees your name they pay slightly more attention than the first. The fifth time, they know what you write about. That accumulation requires reappearance at a predictable interval — and it resets when you disappear.

Fourteen posts in two weeks followed by nothing produces a spike and a decay. Fourteen posts across fourteen weeks produces a reputation.

## Sizing the commitment honestly

Pick the cadence you can hold on your worst week, not your best one. If a difficult month means you post nothing, your cadence was set too high. One post a week and five comments a day is a real commitment that survives a bad quarter.

## The part people skip

Consistency is mostly a scheduling problem, not a writing problem. Decide when you write before you decide what you write. The people who sustain this have a slot; the people who do not have good intentions.`,
  },
];

const caseStudies = [
  {
    slug: "sample-career-change",
    title: "Sample: from agency account management to product marketing",
    userName: "Sample case study",
    userRole: "Illustrative example — not a real customer",
    beforeStats: { profileViews: 40, impressions: 300, followers: 210, connections: 480 },
    afterStats: { profileViews: 620, impressions: 9400, followers: 890, connections: 760 },
    story:
      "This is placeholder content used to demonstrate the case study layout. The numbers are invented. Replace this record with a real, permissioned story before launch — presenting fabricated results as customer outcomes is misleading and, in most jurisdictions, unlawful advertising.",
    testimonial: null,
  },
  {
    slug: "sample-consultant-pipeline",
    title: "Sample: an independent consultant building a pipeline",
    userName: "Sample case study",
    userRole: "Illustrative example — not a real customer",
    beforeStats: { profileViews: 95, impressions: 1200, followers: 640, connections: 1100 },
    afterStats: { profileViews: 1180, impressions: 22000, followers: 1950, connections: 1420 },
    story:
      "This is placeholder content used to demonstrate the case study layout. The numbers are invented. Replace this record with a real, permissioned story before launch.",
    testimonial: null,
  },
  {
    slug: "sample-engineer-brand",
    title: "Sample: an engineer becoming known for one topic",
    userName: "Sample case study",
    userRole: "Illustrative example — not a real customer",
    beforeStats: { profileViews: 60, impressions: 800, followers: 310, connections: 520 },
    afterStats: { profileViews: 840, impressions: 15600, followers: 2400, connections: 690 },
    story:
      "This is placeholder content used to demonstrate the case study layout. The numbers are invented. Replace this record with a real, permissioned story before launch.",
    testimonial: null,
  },
];

async function main() {
  const now = Date.now();

  for (const [index, post] of posts.entries()) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: { ...post, published: true },
      create: {
        ...post,
        published: true,
        publishedAt: new Date(now - index * 6 * 24 * 60 * 60 * 1000),
      },
    });
  }

  for (const study of caseStudies) {
    await prisma.caseStudy.upsert({
      where: { slug: study.slug },
      update: { ...study, published: false },
      create: { ...study, published: false },
    });
  }

  console.log(`Seeded ${posts.length} blog posts and ${caseStudies.length} sample case studies.`);
  console.log("Case studies are created unpublished on purpose — they are placeholders.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
