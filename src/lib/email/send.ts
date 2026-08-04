import "server-only";
import { Resend } from "resend";

/**
 * Outbound mail, with the same shape as the AI layer: real when a key exists,
 * an honest no-op when it does not.
 *
 * Without RESEND_API_KEY nothing is sent and nothing throws — the message is
 * rendered in full and logged, so the cron path can be exercised end to end
 * before any account exists. The return value says which happened, and the
 * caller records that rather than assuming delivery.
 */

const FROM = process.env.EMAIL_FROM ?? "LnkRise <briefs@lnkrise.app>";

export type SendResult =
  | { status: "sent"; id: string }
  | { status: "skipped"; reason: "no_api_key" }
  | { status: "failed"; error: string };

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const { html } = input;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(
      `[email] no RESEND_API_KEY — not sending. to=${input.to} subject="${input.subject}" bytes=${html.length}`,
    );
    return { status: "skipped", reason: "no_api_key" };
  }

  try {
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html,
    });

    if (error) return { status: "failed", error: error.message };
    if (!data) return { status: "failed", error: "Resend returned no id" };

    return { status: "sent", id: data.id };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "unknown error" };
  }
}
