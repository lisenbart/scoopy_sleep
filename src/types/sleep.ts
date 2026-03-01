export type SleepFormData = {
  babyAge: string;
  wakeUpTime: string;
  numNaps: string;
  nightWakings: string;
  parentGoal: string;
  email: string;
};

export type SleepPreview = {
  wakeWindow: string;
  recommendedNaps: string;
  suggestedBedtime: string;
  sampleDaySchedule: string;
};

export type SleepPlanDay = {
  day: number;
  wakeTime: string;
  naps: { start: string; end: string; duration?: string }[];
  bedtime: string;
  notes?: string;
};

export type SleepFullPlan = {
  summary: string;
  days: SleepPlanDay[];
  adjustmentPlan?: string;
  troubleshooting?: string;
  optimizationTips?: string;
};
