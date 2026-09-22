import { Award, TrendingUp } from "lucide-react";

export function LevelProgressCard({ level, totalXp, dailyGoal }: { level: number; totalXp: number; dailyGoal: number }) {
  const floor = Math.max(0, (level - 1) * 500);
  const progress = Math.min(500, Math.max(0, totalXp - floor));
  const suggested = Math.min(8, Math.max(dailyGoal, 2 + Math.floor(level / 5) * 0.5));
  return (
    <section className="surface-card overflow-hidden p-5 sm:p-6">
      <div className="min-w-0">
        <p className="section-label flex items-center gap-2">
          <Award className="size-4" /> Your level
        </p>
        <div className="mt-2 flex items-end gap-2">
          <span className="num text-4xl font-extrabold">{level}</span>
          <span className="pb-1 text-sm font-bold text-muted-foreground">{totalXp} XP</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-blue transition-[width] duration-700"
            style={{ width: `${(progress / 500) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {500 - progress} XP to next level · suggested rhythm {suggested}h/day
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs font-bold">
          <TrendingUp className="size-4 text-blue" /> Small wins daily. Missed days are recovery days, not failure.
        </p>
      </div>
    </section>
  );
}
