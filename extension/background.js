/**
 * Service worker. The only place the ingest key is ever read, so the key never
 * enters a script running inside a linkedin.com tab.
 *
 * Receives numbers from content.js and posts them. Keeps a short history so the
 * popup can show exactly what left the machine — automatic sending removes the
 * confirmation step, not the record of it.
 */

const FIELDS = ["profileViews", "postImpressions", "followers", "connections", "searchAppearances"];
const HISTORY_LIMIT = 5;
const DEDUPE_MS = 10 * 60 * 1000;

function metricsOnly(values) {
  const payload = {};
  for (const field of FIELDS) {
    if (typeof values?.[field] === "number") payload[field] = values[field];
  }
  return payload;
}

async function recordSync(entry) {
  const { history = [] } = await chrome.storage.local.get(["history"]);
  await chrome.storage.local.set({
    history: [entry, ...history].slice(0, HISTORY_LIMIT),
  });
}

async function send(values) {
  const { key, host, lastFingerprint, lastFingerprintAt } = await chrome.storage.local.get([
    "key",
    "host",
    "lastFingerprint",
    "lastFingerprintAt",
  ]);

  if (!key || !host) return { ok: false, reason: "not connected" };

  const payload = metricsOnly(values);
  if (Object.keys(payload).length === 0) return { ok: false, reason: "nothing found" };

  // The SPA re-reads on every route change; don't re-post identical numbers.
  const fingerprint = JSON.stringify(payload);
  if (fingerprint === lastFingerprint && Date.now() - (lastFingerprintAt ?? 0) < DEDUPE_MS) {
    return { ok: true, skipped: true };
  }

  let response;
  try {
    response = await fetch(`${host}/api/ingest/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });
  } catch {
    await recordSync({ at: Date.now(), payload, ok: false, error: "app unreachable" });
    return { ok: false, reason: "app unreachable" };
  }

  if (!response.ok) {
    const error = response.status === 401 ? "key rejected" : `server ${response.status}`;
    await recordSync({ at: Date.now(), payload, ok: false, error });
    return { ok: false, reason: error };
  }

  await chrome.storage.local.set({ lastFingerprint: fingerprint, lastFingerprintAt: Date.now() });
  await recordSync({ at: Date.now(), payload, ok: true });
  return { ok: true };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "lnkrise:analytics") return false;
  void send(message.values).then(sendResponse);
  return true;
});
