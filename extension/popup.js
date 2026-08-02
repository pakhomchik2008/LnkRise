/**
 * Popup controller.
 *
 * Two rules enforced here rather than left to convention:
 *  1. Injection only happens on a path that is necessarily the user's own
 *     (/analytics/ or /dashboard/). Someone else's profile can never be read.
 *  2. Nothing is transmitted until the user has seen the exact numbers and
 *     pressed Send. There is no silent background sync.
 */

const OWN_DATA_PATHS = ["/analytics/", "/dashboard/"];

const FIELDS = [
  ["profileViews", "Profile views"],
  ["postImpressions", "Post impressions"],
  ["followers", "Followers"],
  ["connections", "Connections"],
  ["searchAppearances", "Search appearances"],
];

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

async function render() {
  const { key } = await config();
  el("pair").classList.toggle("hidden", Boolean(key));
  el("main").classList.toggle("hidden", !key);
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
  await chrome.storage.local.remove(["key"]);
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
      files: ["reader.js"],
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
  const payload = {
    profileViews: pending.profileViews ?? 0,
    postImpressions: pending.postImpressions ?? 0,
    followers: pending.followers ?? 0,
    connections: pending.connections ?? 0,
  };
  if (typeof pending.searchAppearances === "number") {
    payload.searchAppearances = pending.searchAppearances;
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
      show("success", `Logged for ${body.date}.`, "ok");
      pending = null;
      el("preview").classList.add("hidden");
    }
  } catch {
    show("error", "Could not reach the app. Is it running?", "error");
  } finally {
    el("send").disabled = false;
  }
});

void render();
