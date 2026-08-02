/**
 * Injected into the active tab only when the user clicks "Read this page".
 * Nothing runs on LinkedIn otherwise — there is no persistent content script.
 *
 * This reads numbers the page is already showing the signed-in member about
 * themselves. It does not click, navigate, submit, follow pagination, or touch
 * any other member's data. The popup restricts injection to /analytics/ and
 * /dashboard/, which are only ever your own pages.
 *
 * The parser is heuristic by necessity: the analytics DOM has no stable ids or
 * data attributes, and the markup changes without notice. It matches on visible
 * label text and takes the nearest number. When LinkedIn reworks the page this
 * will return nulls rather than wrong values — the popup then asks the user to
 * type them instead, which is why the manual path stays in the product.
 */
(() => {
  const LABELS = {
    profileViews: ["profile viewers", "profile views"],
    postImpressions: ["impressions", "post impressions"],
    followers: ["followers"],
    connections: ["connections"],
    searchAppearances: ["search appearances"],
  };

  /** "1,284" / "1.2K" / "18K" / "1.1M" -> integer */
  function parseCount(text) {
    if (!text) return null;
    const match = text.replace(/ /g, " ").match(/(\d[\d,.\s]*)\s*([KkMm])?/);
    if (!match) return null;

    const digits = match[1].replace(/[,\s]/g, "");
    const suffix = match[2];

    // "1.2K" is decimal; "1,284" already had its separators stripped.
    let value = Number(suffix ? digits : digits.replace(/\./g, ""));
    if (!Number.isFinite(value)) return null;

    if (suffix?.toLowerCase() === "k") value *= 1_000;
    if (suffix?.toLowerCase() === "m") value *= 1_000_000;

    return Math.round(value);
  }

  /**
   * Walks visible text nodes and pairs a label with the closest number found
   * in the same element, its previous sibling, or its parent.
   */
  function findByLabel(needles) {
    const nodes = document.querySelectorAll("p, span, h2, h3, div, a, strong");

    for (const node of nodes) {
      if (node.children.length > 3) continue;

      const text = (node.textContent || "").trim().toLowerCase();
      if (text.length > 60) continue;
      if (!needles.some((needle) => text.includes(needle))) continue;

      const candidates = [
        node.previousElementSibling?.textContent,
        node.parentElement?.textContent,
        text,
      ];

      for (const candidate of candidates) {
        const value = parseCount(candidate || "");
        if (value !== null && value > 0) return value;
      }
    }

    return null;
  }

  const result = {};
  for (const [key, needles] of Object.entries(LABELS)) {
    result[key] = findByLabel(needles);
  }

  return {
    url: location.pathname,
    readAt: new Date().toISOString(),
    values: result,
  };
})();
