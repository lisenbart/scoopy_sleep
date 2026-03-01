/**
 * Analytics events for the Sleep Plan flow.
 * Plug into your provider (e.g. gtag, segment, dataLayer) in emit().
 */

export type SleepAnalyticsEvent =
  | "sleep_form_started"
  | "sleep_preview_generated"
  | "sleep_checkout_opened"
  | "sleep_purchase_success"
  | "sleep_pdf_downloaded"
  | "sleep_scoopy_click";

export function emitSleepEvent(
  event: SleepAnalyticsEvent,
  payload?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  try {
    (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.(
      "event",
      event,
      payload
    );
    (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({
      event,
      ...payload,
    });
  } catch {
    // no-op if no analytics configured
  }
}
