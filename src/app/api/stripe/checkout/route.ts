import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  let body: {
    email?: string;
    formData?: Record<string, string>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  const formData = body.formData && typeof body.formData === "object" ? body.formData : {};

  if (!email) {
    return NextResponse.json(
      { error: "email is required" },
      { status: 400 }
    );
  }

  // No trailing slash: avoid double slash in /sleep path (e.g. https://site.com//sleep) which can break history.replaceState
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin).replace(/\/$/, "");

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 900,
            product_data: {
              name: "Sleep Plan — Full 7-Day Plan",
              description: "Personalized baby sleep plan with day-by-day schedule and printable PDF.",
              images: [],
            },
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${baseUrl}/sleep?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/sleep?canceled=1`,
      metadata: {
        product: "sleep_plan",
        ...Object.fromEntries(
          Object.entries(formData).slice(0, 10).map(([k, v]) => [k, String(v).slice(0, 200)])
        ),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 502 }
    );
  }
}
