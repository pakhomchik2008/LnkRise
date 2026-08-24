# LnkRise browser extension

Reads the numbers on your own analytics page and posts them to your LnkRise
account. Read-only, only on pages you open yourself.

## Local development

`manifest.json` ships with only `https://*.lnkrise.app/*` in `host_permissions`
so the packaged build passes Chrome Web Store review. To point the extension
at a local dev server:

1. Add `"http://localhost:3000/*"` to the `host_permissions` array in
   `manifest.json` (do not commit this change).
2. Load the extension unpacked at `chrome://extensions` and pin it.
3. In the popup, paste the API key from your local `/settings` page.

## Files

- `manifest.json` — MV3 declaration
- `background.js` — service worker
- `content.js` + `parser.js` + `reader.js` — content-script logic on
  linkedin.com analytics/dashboard/mynetwork pages
- `popup.html` + `popup.js` — the API-key entry UI

## What it does not do

- Never scrapes profiles the user did not open themselves
- Never posts, connects, or messages on the user's behalf
- Never asks for a LinkedIn password
