import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getBySessionId, setProcessing, setReady, setFailed } from "@/lib/plan-store";
import { generateFullPlan } from "@/lib/generate-full-plan";
import { sendSleepPlanEmail } from "@/lib/sleep-email";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;

  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const existing = await getBySessionId(sessionId);
  if (existing && (existing.status === "ready" || existing.status === "processing")) {
    return NextResponse.json({ received: true });
  }

  await setProcessing(sessionId);
  console.log("[sleep store] sessionId", sessionId.slice(-12), "status", "processing");

  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const babyAge = metadata.babyAge ?? metadata.babyage ?? "";
  const wakeUpTime = metadata.wakeUpTime ?? metadata.wakeuptime ?? "7:00";
  const numNaps = metadata.numNaps ?? metadata.numnaps ?? "";
  const parentGoal = metadata.parentGoal ?? metadata.parentgoal ?? "";

  try {
    const plan = await generateFullPlan({
      babyAge,
      wakeUpTime,
      numNaps,
      parentGoal,
    });

    const token = await setReady(sessionId, plan);
    const customerEmail = session.customer_email ?? (session.customer_details as { email?: string } | null)?.email ?? null;

    if (customerEmail && token) {
      sendSleepPlanEmail(customerEmail, plan, token).catch((err) =>
        console.error("[stripe/webhook] Failed to send email:", err)
      );
    }

    console.log("[sleep store] sessionId", sessionId.slice(-12), "status", "ready");
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] Fulfillment failed:", err);
    await setFailed(sessionId);
    console.log("[sleep store] sessionId", sessionId.slice(-12), "status", "failed");
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 502 });
  }
}
