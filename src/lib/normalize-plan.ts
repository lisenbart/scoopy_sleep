import type { SleepFullPlan } from "@/types/sleep";

export function normalizePlan(plan: SleepFullPlan): SleepFullPlan {
  const p = plan as Record<string, unknown>;
  return {
    summary: typeof p.summary === "string" ? p.summary : "",
    days: Array.isArray(p.days)
      ? p.days.map((d: Record<string, unknown>) => ({
          day: Number(d.day) || 0,
          wakeTime: String(d.wakeTime ?? ""),
          naps: Array.isArray(d.naps)
            ? (d.naps as { start?: unknown; end?: unknown; duration?: unknown }[]).map((n) => ({
                start: String(n?.start ?? ""),
                end: String(n?.end ?? ""),
                duration: n?.duration != null ? String(n.duration) : undefined,
              }))
            : [],
          bedtime: String(d.bedtime ?? ""),
          notes: d.notes != null ? String(d.notes) : undefined,
        }))
      : [],
    adjustmentPlan: p.adjustmentPlan != null ? String(p.adjustmentPlan) : undefined,
    troubleshooting: p.troubleshooting != null ? String(p.troubleshooting) : undefined,
    optimizationTips: p.optimizationTips != null ? String(p.optimizationTips) : undefined,
  };
}
