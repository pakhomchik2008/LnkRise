/**
 * Shared analytics parser. Loaded into the same isolated world as either
 * reader.js (manual popup read) or content.js (automatic read), so both paths
 * use identical logic and can never drift apart.
 *
 * This reads numbers the page is already showing the signed-in member about
 * themselves. It does not click, navigate, submit, follow pagination, or touch
 * any other member's data.
 *
 * The parser is heuristic by necessity: the analytics DOM has no stable ids or
 * data attributes, and the markup changes without notice. When LinkedIn reworks
 * the page this returns nulls rather than wrong values — the manual entry path
 * stays in the product for exactly that reason.
 */
globalThis.lnkriseReadAnalytics = (() => {
  const LABELS = {
    profileViews: ["profile viewers", "profile views"],
    postImpressions: ["impressions", "post impressions"],
    followers: ["followers", "total followers"],
    connections: ["connections"],
    searchAppearances: ["search appearances"],
  };

  const NUMBER_ONLY = /^\d[\d,. \s]*\s*[KkMm]?$/;

  function normalize(text) {
    return (text || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }

  /** "1,284" / "1.2K" / "18K" / "1.1M" -> integer. Rejects anything not purely a number. */
  function parseCount(text) {
    const clean = normalize(text).replace(/[:·|]+$/, "").trim();
    if (!NUMBER_ONLY.test(clean)) return null;

    const match = clean.match(/^(\d[\d,.\s]*?)\s*([KkMm])?$/);
    if (!match) return null;

    const digits = match[1].replace(/[,\s]/g, "");
    const suffix = match[2];

    // "1.2K" is decimal; "1,284" already had its separators stripped.
    const value = Number(suffix ? digits : digits.replace(/\./g, ""));
    if (!Number.isFinite(value)) return null;

    if (suffix?.toLowerCase() === "k") return Math.round(value * 1_000);
    if (suffix?.toLowerCase() === "m") return Math.round(value * 1_000_000);
    return Math.round(value);
  }

  /**
   * True when this element's text is the label, optionally with a trailing
   * qualifier LinkedIn appends — "Profile viewers in 90 days", "Post
   * impressions in 7 days", "Search appearances Jul 21–27" are all real label
   * text on /dashboard/, not just the bare word.
   *
   * Matching is prefix-based rather than substring: "In-network (followers and
   * connections)" does not start with "followers", so it can't hit here the
   * way substring matching once did — that bug took the Discovery card's
   * headline impressions count for every metric.
   */
  function isLabelNode(node, needles) {
    const text = normalize(node.textContent).toLowerCase().replace(/[:·|]+$/, "").trim();
    if (text.length > 45) return false;
    return needles.some((needle) => text.startsWith(needle));
  }

  /**
   * The number must live in its own element next to the label — never anywhere
   * inside a shared ancestor, which is how unrelated metrics leaked in before.
   */
  function numberNear(labelNode, used) {
    const candidates = [labelNode.previousElementSibling, labelNode.nextElementSibling];

    const parent = labelNode.parentElement;
    if (parent) {
      candidates.push(parent.previousElementSibling, parent.nextElementSibling);
      for (const child of parent.children) {
        if (child !== labelNode) candidates.push(child);
      }
    }

    for (const candidate of candidates) {
      if (!candidate || used.has(candidate)) continue;
      const value = parseCount(candidate.textContent);
      if (value !== null && value > 0) {
        used.add(candidate);
        return value;
      }
    }

    return null;
  }

  function findByLabel(needles, used) {
    const nodes = document.querySelectorAll("p, span, h2, h3, h4, div, a, strong, dt, dd, li");

    for (const node of nodes) {
      if (!isLabelNode(node, needles)) continue;
      const value = numberNear(node, used);
      if (value !== null) return value;
    }

    return null;
  }

  return function read() {
    const used = new Set();
    const values = {};
    for (const [key, needles] of Object.entries(LABELS)) {
      values[key] = findByLabel(needles, used);
    }

    return { url: location.pathname, readAt: new Date().toISOString(), values };
  };
})();
