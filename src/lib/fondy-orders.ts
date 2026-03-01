/**
 * In-memory store for Fondy orders (order_id -> formData + email).
 * After payment, callback sets paid=true. Fulfill reads formData and generates plan.
 * For production consider Redis or DB.
 */
export type FondyOrder = {
  email: string;
  formData: Record<string, string>;
  paid: boolean;
};

const store = new Map<string, FondyOrder>();

export function setFondyOrder(orderId: string, data: Omit<FondyOrder, "paid">): void {
  store.set(orderId, { ...data, paid: false });
}

export function getFondyOrder(orderId: string): FondyOrder | undefined {
  return store.get(orderId);
}

export function markFondyOrderPaid(orderId: string): void {
  const o = store.get(orderId);
  if (o) store.set(orderId, { ...o, paid: true });
}
