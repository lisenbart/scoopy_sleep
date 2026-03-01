import OpenAI from "openai";
import type { SleepFullPlan } from "@/types/sleep";

const FULL_PLAN_SYSTEM = `You are a helpful assistant that creates a practical 7-day sleep adjustment plan for babies 0–24 months. Output only valid JSON. Do not make medical claims. Use a calm, practical tone. Base suggestions on commonly referenced pediatric sleep ranges.`;

const FULL_PLAN_SCHEMA = `Return a JSON object with:
- summary: string, 1–2 sentences describing the plan.
- days: array of 7 objects, each with: day (number 1–7), wakeTime (string), naps (array of { start, end, duration? }), bedtime (string), notes (optional string).
- adjustmentPlan: string, 2–4 short paragraphs describing how to use the 7-day plan and what to expect each phase.
- troubleshooting: string, 3–5 short bullet points for common issues (early waking, short naps, bedtime resistance). Use newlines between bullets.
- optimizationTips: string, 3–5 short bullet points for getting the most from the plan (consistency, environment, wind-down). Use newlines between bullets.`;

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey: key });
}

export type FullPlanInput = {
  babyAge: string;
  wakeUpTime: string;
  numNaps: string;
  parentGoal: string;
};

export async function generateFullPlan(input: FullPlanInput): Promise<SleepFullPlan> {
  const { babyAge, wakeUpTime, numNaps, parentGoal } = input;
  const userPrompt = `Create a 7-day gentle sleep adjustment plan. Baby age: ${babyAge} months. Wake-up time: ${wakeUpTime}. Naps: ${numNaps || "age-appropriate"}. Parent goal: ${parentGoal || "predictable schedule"}. ${FULL_PLAN_SCHEMA}`;

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
  if (!raw) throw new Error("Empty response from OpenAI");

  const parsed = JSON.parse(raw) as {
    summary?: string;
    days?: unknown[];
    adjustmentPlan?: string;
    troubleshooting?: string;
    optimizationTips?: string;
  };
  const planSummary = String(parsed.summary ?? "").trim();
  const planDays = Array.isArray(parsed.days) ? parsed.days : [];

  const plan: SleepFullPlan = {
    summary: planSummary || "Your 7-day personalized sleep plan.",
    days: planDays.slice(0, 7).map((d: unknown, i: number) => {
      const dayObj = d as Record<string, unknown>;
      return {
        day: Number(dayObj.day) || i + 1,
        wakeTime: String(dayObj.wakeTime ?? "7:00 AM"),
        naps: Array.isArray(dayObj.naps)
          ? (dayObj.naps as Record<string, string>[]).map((n) => ({
              start: String(n.start ?? ""),
              end: String(n.end ?? ""),
              duration: n.duration ? String(n.duration) : undefined,
            }))
          : [],
        bedtime: String(dayObj.bedtime ?? "7:15 PM"),
        notes: dayObj.notes ? String(dayObj.notes) : undefined,
      };
    }),
    adjustmentPlan: parsed.adjustmentPlan ? String(parsed.adjustmentPlan).trim() : undefined,
    troubleshooting: parsed.troubleshooting ? String(parsed.troubleshooting).trim() : undefined,
    optimizationTips: parsed.optimizationTips ? String(parsed.optimizationTips).trim() : undefined,
  };
  return plan;
}
