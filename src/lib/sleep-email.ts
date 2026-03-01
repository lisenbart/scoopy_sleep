import { Resend } from "resend";
import type { SleepFullPlan } from "@/types/sleep";
import { generateSleepPlanPdfBuffer } from "./sleep-pdf";

const FROM_EMAIL = process.env.SLEEP_EMAIL_FROM ?? "Scoopy Log <onboarding@resend.dev>";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

function getClaimBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Send the sleep plan PDF to the customer by email, with magic link to view plan.
 * No-op if RESEND_API_KEY is not set (e.g. local dev without Resend).
 */
export async function sendSleepPlanEmail(
  to: string,
  plan: SleepFullPlan,
  claimToken: string | null = null
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn("[sleep-email] RESEND_API_KEY not set, skipping email");
    return { ok: false, error: "Email not configured" };
  }

  const baseUrl = getClaimBaseUrl();
  const claimLink = claimToken ? `${baseUrl}/sleep/claim?token=${encodeURIComponent(claimToken)}` : null;

  try {
    const pdfBuffer = generateSleepPlanPdfBuffer(plan);
    const resend = new Resend(RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: "Your 7-Day Sleep Plan from Scoopy Log",
      html: `
        <p>Hi,</p>
        <p>Thanks for your purchase. Your personalized 7-day sleep plan is attached to this email.</p>
        ${claimLink ? `<p><a href="${claimLink}">View your plan online</a> (link valid for 30 days).</p>` : ""}
        <p>— Scoopy Log</p>
      `,
      attachments: [
        {
          filename: "scoopy-log-sleep-plan.pdf",
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("[sleep-email]", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[sleep-email]", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
