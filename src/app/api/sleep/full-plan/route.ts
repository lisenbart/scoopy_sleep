import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { SleepFullPlan } from "@/types/sleep";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey: key });
}

const FULL_PLAN_SYSTEM = `You are a helpful assistant that creates a practical 7-day sleep adjustment plan for babies 0–24 months. Output only valid JSON. Do not make medical claims. Use a calm, practical tone. Base suggestions on commonly referenced pediatric sleep ranges.`;

const FULL_PLAN_SCHEMA = `Return a JSON object with:
- summary: string, 1–2 sentences describing the plan.
- days: array of 7 objects, each with: day (number 1–7), wakeTime (string), naps (array of { start, end, duration? }), bedtime (string), notes (optional string).
- adjustmentPlan: string, 2–4 short paragraphs on how to use the 7-day plan.
- troubleshooting: string, 3–5 short bullet points for common issues. Use newlines between bullets.
- optimizationTips: string, 3–5 short bullet points for getting the most from the plan. Use newlines between bullets.`;

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
    email?: string;
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

  const userPrompt = `Create a 7-day gentle sleep adjustment plan. Baby age: ${babyAge} months. Wake-up time: ${wakeUpTime}. Naps: ${numNaps || "age-appropriate"}. Parent goal: ${parentGoal || "predictable schedule"}. ${FULL_PLAN_SCHEMA}`;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: FULL_PLAN_SYSTEM },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Empty response from OpenAI" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(raw) as {
      summary?: string;
      days?: unknown[];
      adjustmentPlan?: string;
      troubleshooting?: string;
      optimizationTips?: string;
    };
    const summary = String(parsed.summary ?? "").trim();
    const days = Array.isArray(parsed.days) ? parsed.days : [];

    const plan: SleepFullPlan = {
      summary: summary || "Your 7-day personalized sleep plan.",
      days: days.slice(0, 7).map((d: unknown, i: number) => {
        const day = d as Record<string, unknown>;
        return {
          day: Number(day.day) || i + 1,
          wakeTime: String(day.wakeTime ?? "7:00 AM"),
          naps: Array.isArray(day.naps)
            ? (day.naps as Record<string, string>[]).map((n) => ({
                start: String(n.start ?? ""),
                end: String(n.end ?? ""),
                duration: n.duration ? String(n.duration) : undefined,
              }))
            : [],
          bedtime: String(day.bedtime ?? "7:15 PM"),
          notes: day.notes ? String(day.notes) : undefined,
        };
      }),
      adjustmentPlan: parsed.adjustmentPlan ? String(parsed.adjustmentPlan).trim() : undefined,
      troubleshooting: parsed.troubleshooting ? String(parsed.troubleshooting).trim() : undefined,
      optimizationTips: parsed.optimizationTips ? String(parsed.optimizationTips).trim() : undefined,
    };

    return NextResponse.json(plan);
  } catch (err) {
    console.error("[sleep/full-plan]", err);
    return NextResponse.json(
      { error: "Failed to generate full plan" },
      { status: 502 }
    );
  }
}
