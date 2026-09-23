import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Loader2, Play, RefreshCw, SkipForward, X } from "lucide-react";
import {
  TOP_TASKS_COUNT,
  fetchPlan,
  fetchPlanRange,
  generateWeekPlan,
  generatePlan,
  localDateKey,
  monthRange,
  planItemMinutes,
  planItemStatus,
  planTotals,
  setPlanItemState,
  visiblePlanItems,
  weekRange,
  type PlanItemState,
  type PlanStatus,
  type PlanItem,
} from "@/lib/plan";

import { fmtHM, startOfToday, type Session } from "@/lib/study";
import { DAY_MODE_COPY, dayMode } from "@/lib/goals";
import { savePlanDone } from "@/lib/offline-actions";
import { ActivityArtwork } from "@/components/study-ui";
import owlIdle from "@/assets/owl-idle.png";
import beeAsset from "@/assets/bee-baby.riv?url";
import { RivePlayer } from "@/components/ui/rive-player";
import { WeeklyFocusPicker } from "@/components/WeeklyFocusPicker";

const STATUS_STYLE: Record<PlanStatus, { label: string; cls: string }> = {
  complete: { label: "Complete", cls: "bg-[var(--mint-soft)] text-emerald-800" },
  progress: { label: "In progress", cls: "bg-[var(--mustard-soft,#fdf1d6)] text-amber-900" },
  pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
};

const KIND_ART: Record<string, "reading" | "class" | "revision" | "practice"> = {
  reading: "reading",
  revision: "revision",
  notes_revision: "revision",
  class: "class",
  live: "class",
  practice: "practice",
  test: "practice",
};

const KIND_LABEL: Record<string, string> = { notes_revision: "class notes revision" };

/**
 * Today's automatic study plan. If the syllabus produced no plan for today yet,
 * one is generated from subjects, chapters and due revisions on first view.
 */
export function DailyPlanCard({ sessions, title = "Your plan", onStart }: { sessions: Session[]; title?: string; onStart?: (item: PlanItem) => void }) {
  const qc = useQueryClient();
  const planDate = localDateKey();
  const since = useMemo(() => startOfToday(), []);

  const plan = useQuery({ queryKey: ["plan", planDate], queryFn: () => fetchPlan(planDate) });

  const regenerate = useMutation({
    mutationFn: () => generatePlan(planDate),
    onSuccess: (rows) => {
      qc.setQueryData(["plan", planDate], rows);
      if (rows.length === 0)
        toast.info("Add subjects and chapters so a plan can be built for you.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; done: boolean }) => savePlanDone(v.id, v.done),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ["plan", planDate] });
      if (r.queued) toast.success("Offline save — reconnect par sync ho jayega");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Skip / cancel: the database refills the board with the next best task.
  const setState = useMutation({
    mutationFn: (v: { id: string; status: PlanItemState }) => setPlanItemState(v.id, v.status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["plan", planDate] });
      toast.success(v.status === "skipped" ? "Task skipped — next one added" : "Task cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Auto-build today's plan exactly once when the day starts empty.
  useEffect(() => {
    if (plan.isSuccess && (plan.data?.length ?? 0) === 0 && regenerate.isIdle)
      regenerate.mutate();
  }, [plan.isSuccess, plan.data, regenerate]);

  const mode = dayMode();
  const [page, setPage] = useState(0);
  const [range, setRange] = useState<"day" | "week" | "month">("day");
  const bounds = range === "week" ? weekRange() : range === "month" ? monthRange() : null;
  const rangeQuery = useQuery({
    queryKey: ["plan-range", bounds?.from, bounds?.to],
    queryFn: async () => {
      if (range === "week") await generateWeekPlan();
      return fetchPlanRange(bounds!.from, bounds!.to);
    },
    enabled: !!bounds,
  });
  const totals = planTotals(rangeQuery.data ?? []);
  const upcoming = (rangeQuery.data ?? [])
    .filter((i) => i.next_review_at && !i.completed_at)
    .sort((a, b) => (a.next_review_at! < b.next_review_at! ? -1 : 1))
    .slice(0, 5);

  const all = plan.data ?? [];
  const ranked = visiblePlanItems(all);

  const items = ranked.slice(page * TOP_TASKS_COUNT, (page + 1) * TOP_TASKS_COUNT);
  const totalPages = Math.ceil(ranked.length / TOP_TASKS_COUNT);
  const allRows = ranked.map((item) => {
    const minutes = planItemMinutes(item, sessions, since);
    return { item, minutes, status: planItemStatus(item, minutes) };
  });
  const rows = items.map((item) => {
    const minutes = planItemMinutes(item, sessions, since);
    return { item, minutes, status: planItemStatus(item, minutes) };
  });
  const doneCount = allRows.filter((r) => r.status === "complete").length;
  const plannedMinutes = ranked.reduce((a, i) => a + i.target_minutes, 0);
  const busy = setState.isPending;

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-[var(--lavender-soft)]">
          <CalendarDays className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <p className="text-xs font-semibold text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}{" "}
            · {doneCount}/{ranked.length} done · {fmtHM(plannedMinutes)} planned
            

          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {doneCount > 0 ? <RivePlayer src={beeAsset} className="hidden size-12 sm:block" /> : null}
          <button
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-xs font-bold disabled:opacity-60"
          >
            {regenerate.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            Regenerate
          </button>
          <Link to="/timetable" className="text-sm font-semibold text-brand">
            Timetable
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-secondary px-3 py-2.5">
        <p className="text-xs font-extrabold tracking-tight">{DAY_MODE_COPY[mode].title}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{DAY_MODE_COPY[mode].hint}</p>
      </div>
      <WeeklyFocusPicker onSaved={() => regenerate.mutate()} />

      {plan.isLoading ? (
        <div className="mt-5 flex items-center gap-4 rounded-2xl bg-secondary p-3"><img src={owlIdle} alt="" className="size-16 shrink-0 object-contain float-soft" /><p className="text-sm font-semibold text-muted-foreground">Building today's syllabus plan…</p></div>
      ) : rows.length === 0 ? (
        <div className="mt-5 flex items-center gap-4 rounded-2xl bg-secondary p-3"><img src={owlIdle} alt="" className="size-16 shrink-0 object-contain" /><p className="text-sm text-muted-foreground">No plan yet. Add subjects with chapters and press Regenerate.</p></div>
      ) : (
        <ul className="mt-5 space-y-3">
          {rows.map(({ item, minutes, status }) => {
            const style = STATUS_STYLE[status];
            const pct = item.target_minutes
              ? Math.min(100, Math.round((minutes / item.target_minutes) * 100))
              : 0;
            return (
              <li key={item.id} className="rounded-2xl border border-border bg-panel p-3">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                  <ActivityArtwork
                    kind={KIND_ART[item.session_kind] ?? "reading"}
                    className="size-11 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {item.chapter_name ?? item.subject_name ?? "Focus block"}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground capitalize">
                      {item.subject_name ? `${item.subject_name} · ` : ""}
                      {KIND_LABEL[item.session_kind] ?? item.session_kind}
                      {item.source === "resume" ? " · resume" : ""}
                    </p>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-brand transition-[width] duration-700"
                        style={{ width: `${status === "complete" ? 100 : pct}%` }}
                      />
                    </span>
                    <p className="mt-1 text-[10px] font-semibold text-muted-foreground">
                      {minutes > 0 ? `${fmtHM(minutes)} done` : "not started"}
                      {item.review_stage != null && item.review_stage > 0
                        ? ` · pass ${item.review_stage + 1}`
                        : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${style.cls}`}>
                    {style.label}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-end gap-1.5">
                  {onStart && status !== "complete" ? (
                    <button
                      type="button"
                      onClick={() => onStart(item)}
                      aria-label={`Start ${item.chapter_name ?? item.subject_name ?? "plan item"}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3 text-xs font-bold text-background"
                    >
                      <Play className="size-4" aria-hidden="true" /> Start
                    </button>
                  ) : null}
                  {status !== "complete" ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setState.mutate({ id: item.id, status: "skipped" })}
                        aria-label="Skip this task for today"
                        title="Skip"
                        className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground disabled:opacity-50"
                      >
                        <SkipForward className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setState.mutate({ id: item.id, status: "cancelled" })}
                        aria-label="Cancel this task"
                        title="Cancel"
                        className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground disabled:opacity-50"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </>
                  ) : null}
                  <button
                    onClick={() => toggle.mutate({ id: item.id, done: !item.completed_at })}
                    aria-label={item.completed_at ? "Mark as pending" : "Mark as complete"}
                    className={`grid size-9 place-items-center rounded-full border transition ${
                      item.completed_at
                        ? "border-transparent bg-foreground text-background"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" /> Back
          </button>
          <p className="text-[11px] font-bold text-muted-foreground">
            {page + 1} / {totalPages}
          </p>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold disabled:opacity-40"
          >
            Next <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-border bg-panel p-3">
        <div className="flex items-center gap-1.5">
          {(["day", "week", "month"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`min-h-9 rounded-full px-3 text-xs font-bold capitalize transition ${
                range === r ? "bg-foreground text-background" : "border border-border text-muted-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {range === "day" ? (
          <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
            {ranked.length} tasks today · {fmtHM(plannedMinutes)} planned
          </p>
        ) : rangeQuery.isLoading ? (
          <p className="mt-2 text-[11px] font-semibold text-muted-foreground">Loading summary…</p>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {totals.kinds.map((k) => (
                <span key={k.label} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold capitalize">
                  {k.label.replace("_", " ")} · {fmtHM(k.minutes)}
                </span>
              ))}
            </div>
            <ul className="space-y-1.5">
              {totals.chapters.slice(0, 8).map((c) => (
                <li key={c.label} className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                  <span className="truncate">{c.label}</span>
                  <span className="shrink-0 text-muted-foreground">{fmtHM(c.minutes)}</span>
                </li>
              ))}
            </ul>
            {upcoming.length > 0 ? (
              <ul className="space-y-1.5">
                {upcoming.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                    <span className="truncate">{i.chapter_name ?? i.subject_name ?? "Revision"}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {new Date(i.next_review_at!).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
