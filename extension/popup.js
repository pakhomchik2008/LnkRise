/**
 * Popup controller — the manual read, kept for pages the content script does
 * not cover and for re-sending after a failure.
 *
 * Injection only happens on a path that is necessarily the user's own
 * (/analytics/ or /dashboard/). Someone else's profile can never be read.
 *
 * Automatic reads happen in content.js and are sent without confirmation, so
 * this popup shows the recent-sync log: the confirmation step is gone, the
 * record of what left the machine is not.
 */

const OWN_DATA_PATHS = ["/analytics/", "/dashboard/"];

const FIELDS = [
  ["profileViews", "Profile views"],
  ["postImpressions", "Post impressions"],
  ["followers", "Followers"],
  ["connections", "Connections"],
  ["searchAppearances", "Search appearances"],
];

const LABEL_BY_FIELD = Object.fromEntries(FIELDS);

const el = (id) => document.getElementById(id);
let pending = null;

function show(id, message, kind) {
  const node = el(id);
  node.textContent = message;
  node.classList.remove("hidden");
  if (kind) node.className = kind;
  window.setTimeout(() => node.classList.add("hidden"), 6000);
}

async function config() {
  return chrome.storage.local.get(["key", "host"]);
}

function relativeTime(timestamp) {
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

async function renderHistory() {
  const { history = [] } = await chrome.storage.local.get(["history"]);
  const node = el("history");

  if (history.length === 0) {
    node.innerHTML = `<p class="note">Nothing logged yet. Open your analytics page and it records itself.</p>`;
    return;
  }

  node.innerHTML = history
    .map((entry) => {
      const metrics = Object.entries(entry.payload)
        .map(([field, value]) => `${LABEL_BY_FIELD[field] ?? field} ${value.toLocaleString()}`)
        .join(" · ");
      const status = entry.ok
        ? `<span class="tag-ok">sent</span>`
        : `<span class="tag-bad">${entry.error}</span>`;
      return `<div class="log"><div class="log-top">${status}<span>${relativeTime(entry.at)}</span></div><div class="log-metrics">${metrics}</div></div>`;
    })
    .join("");
}

async function render() {
  const { key } = await config();
  el("pair").classList.toggle("hidden", Boolean(key));
  el("main").classList.toggle("hidden", !key);
  if (key) await renderHistory();
}

el("save").addEventListener("click", async () => {
  const key = el("key").value.trim();
  const host = el("host").value.trim().replace(/\/$/, "");

  if (!key.startsWith("lnk_")) return show("error", "That does not look like an ingest key.", "error");
  if (!/^https?:\/\//.test(host)) return show("error", "App URL must start with http:// or https://", "error");

  await chrome.storage.local.set({ key, host });
  el("key").value = "";
  await render();
  show("success", "Connected.", "ok");
});

el("unpair").addEventListener("click", async () => {
  await chrome.storage.local.remove(["key", "history", "lastFingerprint", "lastFingerprintAt"]);
  await render();
});

el("cancel").addEventListener("click", () => {
  pending = null;
  el("preview").classList.add("hidden");
});

el("read").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url || !tab.url.startsWith("https://www.linkedin.com/")) {
    return show("error", "Open your analytics page first.", "error");
  }

  const path = new URL(tab.url).pathname;
  if (!OWN_DATA_PATHS.some((allowed) => path.startsWith(allowed))) {
    return show(
      "error",
      "This only reads /analytics/ and /dashboard/ — pages that are always your own.",
      "error",
    );
  }

  let injected;
  try {
    [injected] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["parser.js", "reader.js"],
    });
  } catch {
    return show("error", "Could not read the page. Reload it and try again.", "error");
  }

  const values = injected?.result?.values ?? {};
  const found = FIELDS.filter(([field]) => typeof values[field] === "number");

  if (found.length === 0) {
    return show(
      "error",
      "Found no numbers on this page. LinkedIn may have changed the layout — log them by hand in the app.",
      "error",
    );
  }

  pending = values;
  el("rows").innerHTML = FIELDS.map(([field, label]) => {
    const value = values[field];
    const display =
      typeof value === "number"
        ? `<span>${value.toLocaleString()}</span>`
        : `<span class="missing">not found</span>`;
    return `<div class="row"><span>${label}</span>${display}</div>`;
  }).join("");

  el("preview").classList.remove("hidden");
});

el("send").addEventListener("click", async () => {
  if (!pending) return;

  const { key, host } = await config();

  // Only send what was actually on the page. Sending 0 for a missing metric
  // would overwrite a correct value read earlier from a different analytics
  // page — Profile views only exist on /dashboard/, impressions on /analytics/.
  const payload = {};
  for (const [field] of FIELDS) {
    if (typeof pending[field] === "number") payload[field] = pending[field];
  }

  el("send").disabled = true;

  try {
    const response = await fetch(`${host}/api/ingest/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      show("error", "Key rejected. Create a new one in Settings.", "error");
    } else if (response.status === 429) {
      show("error", "Too many sends. Wait a minute.", "error");
    } else if (!response.ok) {
      show("error", `Server said ${response.status}.`, "error");
    } else {
      const body = await response.json();
      const { history = [] } = await chrome.storage.local.get(["history"]);
      await chrome.storage.local.set({
        history: [{ at: Date.now(), payload, ok: true }, ...history].slice(0, 5),
      });
      show("success", `Logged for ${body.date}.`, "ok");
      pending = null;
      el("preview").classList.add("hidden");
      await renderHistory();
    }
  } catch {
    show("error", "Could not reach the app. Is it running?", "error");
  } finally {
    el("send").disabled = false;
  }
});

void render();
