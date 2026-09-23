import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchSubjects } from "@/lib/study";
import { localDateKey } from "@/lib/plan";

function monday(d: Date) {
  const m = new Date(d);
  m.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  m.setHours(0, 0, 0, 0);
  return m;
}

/** Pick this week's main subjects: they get ~60% of new chapter time, the rest share 40%. */
export function WeeklyFocusPicker({ onSaved }: { onSaved?: () => void }) {
  const qc = useQueryClient();
  const [week, setWeek] = useState(() => monday(new Date()));
  const weekKey = localDateKey(week);
  const subjects = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });
  const focus = useQuery({
    queryKey: ["weekly-focus", weekKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_focus" as never)
        .select("subject_ids")
        .eq("week_start", weekKey)
        .maybeSingle();
      if (error) throw error;
      return ((data as { subject_ids?: string[] } | null)?.subject_ids ?? []) as string[];
    },
  });
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => setPicked(focus.data ?? []), [focus.data]);

  const save = async (ids: string[]) => {
    setPicked(ids);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase
      .from("weekly_focus" as never)
      .upsert({ user_id: auth.user.id, week_start: weekKey, subject_ids: ids } as never, {
        onConflict: "user_id,week_start",
      });
    if (error) return toast.error("Could not save weekly focus");
    qc.invalidateQueries({ queryKey: ["weekly-focus", weekKey] });
    if (weekKey === localDateKey(monday(new Date()))) onSaved?.();
  };

  const shift = (days: number) => {
    const n = new Date(week);
    n.setDate(week.getDate() + days);
    setWeek(n);
  };
  const end = new Date(week);
  end.setDate(week.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });

  if (!subjects.data?.length) return null;
  return (
    <div className="mt-3 rounded-2xl border border-border p-3">
      <div className="flex items-center gap-2">
        <Star className="size-4 text-brand" aria-hidden="true" />
        <p className="text-xs font-extrabold">Main subjects this week (60%)</p>
        <div className="ml-auto flex items-center gap-1 text-[11px] font-bold">
          <button aria-label="Previous week" onClick={() => shift(-7)} className="rounded-full p-1 hover:bg-secondary">
            <ChevronLeft className="size-4" />
          </button>
          <span>
            {fmt(week)} – {fmt(end)}
          </span>
          <button aria-label="Next week" onClick={() => shift(7)} className="rounded-full p-1 hover:bg-secondary">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {subjects.data.map((s) => {
          const on = picked.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => save(on ? picked.filter((x) => x !== s.id) : [...picked, s.id])}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                on ? "border-transparent bg-primary text-primary-foreground" : "border-border"
              }`}
            >
              {s.name}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Baaki subjects 40% time share karenge. Day length = profile ka "Average study time".
      </p>
    </div>
  );
}
