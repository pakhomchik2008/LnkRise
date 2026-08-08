/**
 * "Time to post" reminder for a scheduled draft.
 *
 * Same shape as daily-brief.ts (HTML string, not JSX — see that file for why)
 * and the same escaping rule: the post body is the user's own text, but it
 * can still contain `&`, `<`, `>` from ordinary writing, and those must not
 * corrupt the surrounding markup.
 *
 * This is a nudge, not a publish. The official API is not approved for
 * w_member_social yet, so there is no auto-post path — the email exists to
 * put the exact text in front of the user at the right moment so they can
 * paste it themselves.
 */

const BRAND = "#2b59ff";
const INK = "#101322";
const MUTED = "#5b6178";
const HAIRLINE = "#e4e7f0";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface PostReminderEmailProps {
  name: string;
  content: string;
  editorUrl: string;
}

export function postReminderEmailHtml({ name, content, editorUrl }: PostReminderEmailProps): string {
  // \n -> <br> only, after escaping — the content has no other markup to preserve.
  const bodyHtml = escapeHtml(content).replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Time to post</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f6fa">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">The post you scheduled is ready to go.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding:32px 16px">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:14px;border:1px solid ${HAIRLINE}">
        <tr>
          <td style="padding:24px;font-family:${FONT}">
            <p style="margin:0 0 20px;font-size:17px;font-weight:700;color:${INK}">LnkRise</p>

            <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${INK};line-height:1.3">Time to post, ${escapeHtml(name)}.</h1>
            <p style="margin:0 0 20px;font-size:14px;color:${MUTED};line-height:1.6">This is the time you picked. We are not posting it for you — copy it below and paste it in.</p>

            <div style="padding:16px 18px;border:1px solid ${HAIRLINE};border-radius:10px;font-size:14px;line-height:1.65;color:${INK};white-space:pre-wrap;margin-bottom:22px">${bodyHtml}</div>

            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <a href="${escapeHtml(editorUrl)}" style="display:inline-block;padding:13px 26px;background-color:${BRAND};color:#ffffff;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;font-family:${FONT}">Open in the editor</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
}

export function postReminderSubject(): string {
  return "Time to post — your scheduled draft is ready";
}
