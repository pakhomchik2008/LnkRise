/**
 * Placeholder values shared by every mock generator.
 *
 * `{topic}` used to be `industry.toLowerCase()`, for templates that drop the
 * field mid-sentence ("doing {topic} the slow way"). That mangles any field
 * the user capitalised — "B2B SaaS" came out as "b2b saas", which reads as a
 * typo in a message they are about to send to a stranger.
 *
 * Both placeholders now carry the field exactly as the user typed it. Someone
 * who wrote "platform engineering" already gets lowercase; someone who wrote
 * "B2B SaaS" keeps their capitals. The user's own spelling is the only source
 * that knows which is right.
 */
export function templateVars(industry: string): Record<string, string> {
  const field = industry || "your field";
  return {
    industry: field,
    topic: field,
    // Left intact on purpose: the user replaces this with the recipient's name.
    name: "{name}",
  };
}
