import type { Session } from "@/lib/study";

/**
 * Percentage based daily goals.
 *
 * A day is not measured in hours any more — every activity earns a percentage
 * of the day's goal per hour spent on it. One minute already counts (pro-rata),
 * but an activity has to run at least `minCountMinutes` before it counts at all.
 */
export type PercentPerHour = {
  revision: number;
  reading: number;
  class: number;
  newspaper: number;
  practice: number;
  test: number;
};

export const DEFAULT_PERCENT_PER_HOUR: PercentPerHour = {
  revision: 25,
  reading: 20,
  class: 18,
  newspaper: 20,
  practice: 20,
  test: 20,
};

export const DEFAULT_MIN_COUNT_MINUTES = 5;

export type GoalConfig = {
  percentPerHour: PercentPerHour;
  minCountMinutes: number;
  dailyGoalPercent: number;
  weeklyGoalPercent: number;
  weeklyGrowthFactor: number;
  weeklyGrowthCapPercent: number;
};

export const DEFAULT_GOAL_CONFIG: GoalConfig = {
  percentPerHour: DEFAULT_PERCENT_PER_HOUR,
  minCountMinutes: DEFAULT_MIN_COUNT_MINUTES,
  dailyGoalPercent: 100,
  weeklyGoalPercent: 100,
  weeklyGrowthFactor: 2,
  weeklyGrowthCapPercent: 150,
};

type ActivityKey = keyof PercentPerHour;

function activityKey(kind: string | null | undefined): ActivityKey {
  switch (kind) {
    case "revision":
      return "revision";
    case "class":
    case "live":
      return "class";
    case "newspaper":
    case "magazine":
      return "newspaper";
    case "practice":
      return "practice";
    case "test":
      return "test";
    default:
      return "reading";
  }
}

/** Percent earned by a single block of minutes of one activity. */
export function percentFor(kind: string | null | undefined, minutes: number, config = DEFAULT_GOAL_CONFIG) {
  if (minutes < config.minCountMinutes) return 0;
  const rate = config.percentPerHour[activityKey(kind)] ?? 20;
  return (minutes / 60) * rate;
}

export type DayProgress = {
  /** Percent of the day's goal earned so far (uncapped). */
  percent: number;
  /** Percent clamped to the goal, for progress bars. */
  displayPercent: number;
  minutes: number;
  /** Percent earned per activity, biggest first. */
  breakdown: { key: ActivityKey; label: string; percent: number; minutes: number }[];
  complete: boolean;
};

const LABELS: Record<ActivityKey, string> = {
  revision: "Revision",
  reading: "New reading",
  class: "Online class",
  newspaper: "Newspaper",
  practice: "Practice",
  test: "Tests",
};

/** Roll a day's sessions (plus reading minutes) into percentage progress. */
export function dayProgress(
  sessions: Session[],
  extras: { kind: string; minutes: number }[] = [],
  config = DEFAULT_GOAL_CONFIG,
): DayProgress {
  const byKey = new Map<ActivityKey, number>();
  const push = (kind: string | null | undefined, minutes: number) => {
    if (minutes <= 0) return;
    const key = activityKey(kind);
    byKey.set(key, (byKey.get(key) ?? 0) + minutes);
  };

  for (const s of sessions) {
    const minutes = s.is_running
      ? Math.max(0, Math.floor((Date.now() - new Date(s.started_at).getTime()) / 60_000) - (s.break_minutes ?? 0))
      : (s.duration_minutes ?? 0);
    push(s.kind, minutes);
  }
  for (const extra of extras) push(extra.kind, extra.minutes);

  const breakdown = [...byKey.entries()]
    .map(([key, minutes]) => ({
      key,
      label: LABELS[key],
      minutes,
      percent: percentFor(key, minutes, config),
    }))
    .filter((row) => row.minutes > 0)
    .sort((a, b) => b.percent - a.percent);

  const percent = breakdown.reduce((sum, row) => sum + row.percent, 0);
  const minutes = breakdown.reduce((sum, row) => sum + row.minutes, 0);
  const goal = Math.max(1, config.dailyGoalPercent);

  return {
    percent: Math.round(percent),
    displayPercent: Math.min(100, Math.round((percent / goal) * 100)),
    minutes,
    breakdown,
    complete: percent >= goal,
  };
}

/**
 * Weekly target = past performance x growth factor, held inside a safety cap so
 * a strong week never explodes into an impossible one.
 */
export function weeklyTargetPercent(
  lastWeeksPercent: number[],
  config = DEFAULT_GOAL_CONFIG,
): number {
  const samples = lastWeeksPercent.filter((n) => n > 0);
  const base = samples.length
    ? samples.reduce((a, b) => a + b, 0) / samples.length
    : config.dailyGoalPercent * 5;
  const grown = base * config.weeklyGrowthFactor;
  const floor = config.dailyGoalPercent * 4;
  const cap = base * (config.weeklyGrowthCapPercent / 100) + config.dailyGoalPercent;
  return Math.round(Math.max(floor, Math.min(grown, cap)));
}

/** What kind of day this is under the chapter-based task rules. */
export type DayMode = "weekly_revision" | "monthly_revision" | "normal";

export function dayMode(date = new Date()): DayMode {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  if (date.getDate() >= lastDay - 1) return "monthly_revision";
  if (date.getDay() === 0) return "weekly_revision";
  return "normal";
}

export const DAY_MODE_COPY: Record<DayMode, { title: string; hint: string }> = {
  weekly_revision: {
    title: "Sunday revision day",
    hint: "Aaj sirf is hafte padhe hue chapters aur classes dobara — kuch naya nahi.",
  },
  monthly_revision: {
    title: "Month-end revision",
    hint: "Mahine bhar me jo padha hai sirf usi ka revision — naya chapter nahi.",
  },
  normal: {
    title: "Study day",
    hint: "Due revisions, adhure chapters jahan chhoda tha wahin se, phir naya chapter.",
  },
};

/** The spaced ladder used across chapters and class notes. */
export const REVIEW_INTERVALS = [1, 3, 7, 15, 30] as const;

export function nextReviewLabel(stage: number) {
  const days = REVIEW_INTERVALS[Math.min(stage, REVIEW_INTERVALS.length - 1)] ?? 30;
  return `+${days}d`;
}
