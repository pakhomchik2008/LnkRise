import type { DailyBriefContent } from "@/types";

/**
 * The morning email.
 *
 * Built as an HTML string rather than JSX: Next.js refuses to bundle
 * `react-dom/server` into the App Router, so rendering a component to markup
 * is not available here. That costs little — mail HTML is inline-styled
 * tables regardless, because Outlook's Word rendering engine ignores flexbox
 * and grid and Gmail strips <style> blocks in several contexts. This is the
 * same markup a react-email component would have compiled down to.
 */

const BRAND = "#2b59ff";
const INK = "#101322";
const MUTED = "#5b6178";
const HAIRLINE = "#e4e7f0";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/**
 * Every interpolated value is escaped. The brief is model-written and the
 * name is user-supplied, so neither is trusted markup — an unescaped
 * apostrophe or angle bracket would corrupt the email at best.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface DailyBriefEmailProps {
  name: string;
  brief: DailyBriefContent;
  growthScore: number;
  streak: number;
  briefUrl: string;
  settingsUrl: string;
}

function action(label: string, title: string, detail: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
    <tr>
      <td style="padding:16px 18px;border:1px solid ${HAIRLINE};border-radius:10px;font-family:${FONT}">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND}">${escapeHtml(label)}</p>
        <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:${INK};line-height:1.4">${escapeHtml(title)}</p>
        <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.55">${escapeHtml(detail)}</p>
      </td>
    </tr>
  </table>`;
}

function pill(text: string, background: string, color: string): string {
  return `<td style="padding:6px 12px;background-color:${background};border-radius:999px;font-size:12px;font-weight:600;color:${color}">${escapeHtml(text)}</td>`;
}

export function dailyBriefEmailHtml({
  name,
  brief,
  growthScore,
  streak,
  briefUrl,
  settingsUrl,
}: DailyBriefEmailProps): string {
  const firstConnect = brief.connectWith[0];
  const firstComment = brief.commentOn[0];

  const actions = [
    action("Post", brief.postIdea.topic, brief.postIdea.hook),
    firstConnect ? action("Reach out", firstConnect.audience, firstConnect.why) : "",
    firstComment ? action("Join a conversation", firstComment.topic, firstComment.why) : "",
  ].join("");

  const streakText = streak === 0 ? "No streak yet" : `${streak} day${streak === 1 ? "" : "s"} in a row`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Your plan for today</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f6fa">
<!-- Preheader: shown next to the subject in the inbox list, hidden in the body. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(brief.todayFocus)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding:32px 16px">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:14px;border:1px solid ${HAIRLINE}">
        <tr>
          <td style="padding:24px 24px 0;font-family:${FONT}">
            <p style="margin:0;font-size:17px;font-weight:700;color:${INK}">LnkRise</p>
            <h1 style="margin:20px 0 6px;font-size:21px;font-weight:700;color:${INK};line-height:1.3">Good morning, ${escapeHtml(name)}.</h1>
            <p style="margin:0 0 20px;font-size:14px;color:${MUTED};line-height:1.6">${escapeHtml(brief.todayFocus)}</p>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:22px">
              <tr>
                ${pill(`Growth score ${growthScore}`, "#eef1ff", BRAND)}
                <td style="width:8px"></td>
                ${pill(streakText, "#fff4e8", "#9a4b00")}
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 24px">${actions}</td>
        </tr>

        <tr>
          <td align="center" style="padding:8px 24px 28px">
            <a href="${escapeHtml(briefUrl)}" style="display:inline-block;padding:13px 26px;background-color:${BRAND};color:#ffffff;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;font-family:${FONT}">View the full brief</a>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr>
          <td align="center" style="padding:18px 12px 0;font-size:12px;color:${MUTED};line-height:1.6;font-family:${FONT}">
            You are getting this because daily briefs are on.
            <a href="${escapeHtml(settingsUrl)}" style="color:${MUTED}">Turn them off</a>.
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
}

export function dailyBriefSubject(brief: DailyBriefContent): string {
  return `Today: ${brief.postIdea.topic}`;
}
