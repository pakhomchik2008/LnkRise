/**
 * Automatic read. Runs only on the analytics pages the manifest matches, which
 * are always the signed-in member's own.
 *
 * It reads a page the user themselves opened. It never navigates, opens tabs,
 * clicks, or runs on a schedule — LinkedIn is only ever touched as a
 * consequence of the user going there.
 *
 * The ingest key is deliberately not read here. This script runs inside a
 * linkedin.com tab, so it hands the numbers to the service worker and lets that
 * do the authenticated request.
 */

const RETRY_DELAY_MS = 1500;
const MAX_ATTEMPTS = 6;
const ROUTE_POLL_MS = 2000;

let lastPath = null;
let lastSent = null;

function hasAnyValue(values) {
  return Object.values(values).some((value) => typeof value === "number");
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Analytics numbers stream in after the shell renders, so poll for them. */
async function readWhenReady() {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const result = globalThis.lnkriseReadAnalytics();
    if (hasAnyValue(result.values)) return result;
    await wait(RETRY_DELAY_MS);
  }
  return null;
}

async function sync() {
  const result = await readWhenReady();
  if (!result) return;

  const fingerprint = JSON.stringify(result.values);
  if (fingerprint === lastSent) return;
  lastSent = fingerprint;

  try {
    await chrome.runtime.sendMessage({ type: "lnkrise:analytics", values: result.values });
  } catch {
    // Service worker asleep or extension reloading — the next visit retries.
  }
}

lastPath = location.pathname;
void sync();

// LinkedIn analytics is a single-page app: moving between Content and Audience
// analytics swaps the numbers without a navigation event.
setInterval(() => {
  if (location.pathname === lastPath) return;
  lastPath = location.pathname;
  lastSent = null;
  void sync();
}, ROUTE_POLL_MS);
