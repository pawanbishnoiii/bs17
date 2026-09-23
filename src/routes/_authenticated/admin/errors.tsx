import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, Search, Trash2 } from "lucide-react";
import {
  deleteErrorEvent,
  fetchErrorEvents,
  resolveErrorEvent,
  type ErrorEvent,
} from "@/lib/error-log";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/errors")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Error monitor — Bnoy Study Admin" },
      {
        name: "description",
        content: "Failed uploads, email tests and sign-in attempts with searchable details and resolution status.",
      },
      { property: "og:title", content: "Error monitor — Bnoy Study Admin" },
      {
        property: "og:description",
        content: "Track and resolve failed uploads, email tests and authentication attempts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ErrorMonitorPage,
});

const CATEGORIES = ["all", "upload", "email", "auth", "storage", "plan", "other"] as const;
const STATUSES = ["open", "resolved", "all"] as const;

function ErrorMonitorPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<"all" | "open" | "resolved">("open");
  const [openRow, setOpenRow] = useState<string | null>(null);

  const events = useQuery({
    queryKey: ["error-events", term, category, status],
    queryFn: () => fetchErrorEvents({ search: term, category, status }),
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: ["error-events"] });

  const toggle = useMutation({
    mutationFn: (v: { id: string; resolved: boolean }) => resolveErrorEvent(v.id, v.resolved),
    onSuccess: () => {
      refresh();
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteErrorEvent(id),
    onSuccess: () => {
      refresh();
      toast.success("Entry deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = events.data ?? [];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Error monitor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Failed uploads, email tests and authentication attempts — searchable, with resolution status.
        </p>
      </header>

      <div className="rounded-3xl border border-border bg-panel p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTerm(search);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search message or context…"
              className="h-11 w-full rounded-xl border border-border bg-background pr-3 pl-9 text-sm outline-none focus:border-warm/60"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
          <Button type="button" variant="ghost" onClick={() => refresh()}>
            <RotateCcw className="size-4" />
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                category === c ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
          <span className="mx-1 w-px bg-border" />
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                status === s ? "bg-[var(--lavender)] text-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {events.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-border bg-panel p-8 text-center">
          <p className="text-sm font-semibold">No matching events</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Failures are recorded here automatically as they happen.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-border bg-panel p-4">
              <div className="flex flex-wrap items-start gap-3">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold capitalize"
                  style={{
                    background:
                      row.category === "upload"
                        ? "var(--blue)"
                        : row.category === "email"
                          ? "var(--yellow)"
                          : row.category === "auth"
                            ? "var(--lavender)"
                            : "var(--secondary)",
                  }}
                >
                  {row.category}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold break-words">{row.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                    {row.context ? ` · ${row.context}` : ""}
                    {row.resolved ? " · resolved" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant={row.resolved ? "ghost" : "secondary"}
                    onClick={() => toggle.mutate({ id: row.id, resolved: !row.resolved })}
                  >
                    <CheckCircle2 className="size-4" />
                    {row.resolved ? "Reopen" : "Resolve"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(row.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenRow(openRow === row.id ? null : row.id)}
                className="mt-2 text-xs font-semibold text-muted-foreground underline"
              >
                {openRow === row.id ? "Hide details" : "Show details"}
              </button>
              {openRow === row.id ? <Details row={row} /> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Details({ row }: { row: ErrorEvent }) {
  return (
    <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-secondary p-3 text-[11px] leading-5 whitespace-pre-wrap">
      {JSON.stringify({ severity: row.severity, user_id: row.user_id, ...row.detail }, null, 2)}
    </pre>
  );
}
