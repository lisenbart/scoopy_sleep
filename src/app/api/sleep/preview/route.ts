import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey: key });
}

const PREVIEW_SYSTEM = `You are a helpful assistant that suggests practical sleep structure for babies 0–24 months. You give only structured, concise output. Do not make medical claims. Use a calm, practical tone. Base suggestions on commonly referenced pediatric sleep ranges (wake windows, nap counts by age). Output valid JSON only.`;

const PREVIEW_SCHEMA = `Return a JSON object with exactly these keys (all strings):
- wakeWindow: e.g. "2h – 2h 30m" or "2h 30m – 3h"
- recommendedNaps: e.g. "2–3" or "3–4"
- suggestedBedtime: e.g. "7:00 PM" or "7:30 PM"
- sampleDaySchedule: one short paragraph describing a sample day (wake time, nap windows, bedtime) in plain language, no bullet points.`;

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI is not configured" },
      { status: 503 }
    );
  }

  let body: {
    babyAge?: string;
    wakeUpTime?: string;
    numNaps?: string;
    nightWakings?: string;
    parentGoal?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const babyAge = String(body.babyAge ?? "").trim();
  const wakeUpTime = String(body.wakeUpTime ?? "7:00").trim();
  const numNaps = String(body.numNaps ?? "").trim();
  const parentGoal = String(body.parentGoal ?? "").trim();

  if (!babyAge) {
    return NextResponse.json(
      { error: "babyAge is required" },
      { status: 400 }
    );
  }

  const userPrompt = `Baby age: ${babyAge} months. Typical wake-up time: ${wakeUpTime}. Number of naps: ${numNaps || "not specified"}. Parent goal: ${parentGoal || "general structure"}. ${PREVIEW_SCHEMA}`;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PREVIEW_SYSTEM },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Empty response from OpenAI" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const wakeWindow = String(parsed.wakeWindow ?? "—").trim();
    const recommendedNaps = String(parsed.recommendedNaps ?? "—").trim();
    const suggestedBedtime = String(parsed.suggestedBedtime ?? "—").trim();
    const sampleDaySchedule = String(parsed.sampleDaySchedule ?? "").trim();

    return NextResponse.json({
      wakeWindow,
      recommendedNaps,
      suggestedBedtime,
      sampleDaySchedule: sampleDaySchedule || "A sample day will be included in your full plan.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sleep/preview]", message, err);
    return NextResponse.json(
      {
        error: "Failed to generate preview",
        ...(process.env.NODE_ENV === "development" && { detail: message }),
      },
      { status: 502 }
    );
  }
}
