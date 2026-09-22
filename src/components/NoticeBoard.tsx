import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Pin, PinOff, Plus, StickyNote, Trash2 } from "lucide-react";
import { addNotice, deleteNotice, fetchNotices, updateNotice, type Notice } from "@/lib/notices";
import { Button } from "@/components/ui/button";

/** Today page notice board — private to each student. */
export function NoticeBoard() {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const notices = useQuery({ queryKey: ["notices"], queryFn: fetchNotices });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["notices"] });

  const add = useMutation({
    mutationFn: () => addNotice(text),
    onSuccess: () => {
      setText("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: (v: { id: string; patch: Partial<Notice> }) => updateNotice(v.id, v.patch),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteNotice(id),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = notices.data ?? [];
  const open = rows.filter((n) => !n.done);
  const done = rows.filter((n) => n.done);

  return (
    <section className="surface-card p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--peach-soft,#ffe6d4)]">
          <StickyNote className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-extrabold tracking-tight">Notice board</h2>
          <p className="truncate text-[11px] text-muted-foreground">
            Sirf aapke liye — reminders, deadlines, chhoti baatein.
          </p>
        </div>
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) add.mutate();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Kal Polity revision karna hai…"
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand/60"
        />
        <Button type="submit" disabled={!text.trim() || add.isPending} className="shrink-0 gap-1">
          <Plus className="size-4" /> Add
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Abhi koi notice nahi. Upar likh kar apna pehla reminder add karein.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {[...open, ...done].map((n) => (
            <li
              key={n.id}
              className={`flex items-center gap-2 rounded-2xl border border-border bg-panel p-3 ${
                n.done ? "opacity-55" : ""
              }`}
            >
              <button
                type="button"
                aria-label={n.done ? "Mark as not done" : "Mark as done"}
                onClick={() => patch.mutate({ id: n.id, patch: { done: !n.done } })}
                className={`grid size-8 shrink-0 place-items-center rounded-full border transition ${
                  n.done ? "border-transparent bg-foreground text-background" : "border-border text-muted-foreground"
                }`}
              >
                <Check className="size-4" />
              </button>
              <span className={`min-w-0 flex-1 text-sm font-semibold ${n.done ? "line-through" : ""}`}>
                {n.body}
              </span>
              <button
                type="button"
                aria-label={n.pinned ? "Unpin notice" : "Pin notice"}
                onClick={() => patch.mutate({ id: n.id, patch: { pinned: !n.pinned } })}
                className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
              >
                {n.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
              </button>
              <button
                type="button"
                aria-label="Delete notice"
                onClick={() => remove.mutate(n.id)}
                className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
