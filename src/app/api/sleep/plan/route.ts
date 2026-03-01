import { NextRequest, NextResponse } from "next/server";
import { getBySessionId, getByToken } from "@/lib/plan-store";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const token = request.nextUrl.searchParams.get("token");

  if (sessionId) {
    const entry = await getBySessionId(sessionId);
    if (!entry) {
      return NextResponse.json({ status: "processing" });
    }
    if (entry.status === "ready" && entry.plan) {
      return NextResponse.json({ status: "ready", plan: entry.plan, claimToken: entry.token });
    }
    if (entry.status === "failed") {
      return NextResponse.json({ status: "failed" }, { status: 502 });
    }
    if (entry.status === "expired") {
      return NextResponse.json({ status: "expired" }, { status: 410 });
    }
    return NextResponse.json({ status: "processing" });
  }

  if (token) {
    const entry = await getByToken(token);
    if (!entry) {
      return NextResponse.json({ status: "expired" }, { status: 410 });
    }
    if (entry.status === "ready" && entry.plan) {
      return NextResponse.json({ status: "ready", plan: entry.plan });
    }
    if (entry.status === "failed") {
      return NextResponse.json({ status: "failed" }, { status: 502 });
    }
    return NextResponse.json({ status: "processing" });
  }

  return NextResponse.json({ error: "session_id or token required" }, { status: 400 });
}
