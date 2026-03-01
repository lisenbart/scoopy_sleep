import { NextRequest, NextResponse } from "next/server";
import { getBySessionId } from "@/lib/plan-store";

/**
 * Read-only: returns plan from store (populated by Stripe webhook).
 * Client may poll until status is ready.
 */
export async function POST(request: NextRequest) {
  let body: { session_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = String(body.session_id ?? "").trim();
  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const entry = await getBySessionId(sessionId);
  if (!entry) {
    return NextResponse.json({ status: "processing" });
  }
  if (entry.status === "ready" && entry.plan) {
    return NextResponse.json(entry.plan);
  }
  if (entry.status === "failed") {
    return NextResponse.json({ error: "Plan generation failed" }, { status: 502 });
  }
  if (entry.status === "expired") {
    return NextResponse.json({ error: "Link expired" }, { status: 410 });
  }
  return NextResponse.json({ status: "processing" });
}
