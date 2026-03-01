import crypto from "crypto";

const FONDY_CHECKOUT_URL = "https://pay.fondy.eu/api/checkout/url";

/**
 * Fondy signature: sort params by key, concatenate values with "|",
 * prepend merchant_password, then SHA1 hex.
 * @see https://docs.fondy.eu
 */
export function buildFondySignature(params: Record<string, string>, merchantPassword: string): string {
  const sortedKeys = Object.keys(params).filter((k) => params[k] !== "" && params[k] != null).sort();
  const values = [merchantPassword, ...sortedKeys.map((k) => String(params[k]))];
  const str = values.join("|");
  return crypto.createHash("sha1").update(str, "utf8").digest("hex");
}

export type FondyCheckoutParams = {
  merchant_id: string;
  merchant_password: string;
  amount: number; // cents
  currency: string;
  order_id: string;
  order_desc: string;
  response_url?: string;
  server_callback_url?: string;
};

/**
 * Create Fondy checkout and return redirect URL.
 */
export async function createFondyCheckout(params: FondyCheckoutParams): Promise<string> {
  const { merchant_password, ...rest } = params;
  const requestBody: Record<string, string> = {
    merchant_id: String(rest.merchant_id),
    amount: String(rest.amount),
    currency: rest.currency,
    order_id: rest.order_id,
    order_desc: rest.order_desc,
    ...(rest.response_url && { response_url: rest.response_url }),
    ...(rest.server_callback_url && { server_callback_url: rest.server_callback_url }),
  };
  requestBody.signature = buildFondySignature(requestBody, merchant_password);

  const res = await fetch(FONDY_CHECKOUT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request: requestBody }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fondy API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { response?: { checkout_url?: string }; checkout_url?: string };
  const url =
    data.response?.checkout_url ?? (data as Record<string, string>).checkout_url;
  if (!url || typeof url !== "string") {
    throw new Error("Fondy did not return checkout_url");
  }
  return url;
}

/**
 * Verify callback signature from Fondy (same algorithm as request).
 */
export function verifyFondyCallback(params: Record<string, string>, merchantPassword: string): boolean {
  const received = params.signature;
  if (!received) return false;
  const rest = { ...params };
  delete rest.signature;
  const expected = buildFondySignature(rest as Record<string, string>, merchantPassword);
  return crypto.timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
}
